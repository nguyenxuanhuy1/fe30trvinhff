"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DollarOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  adjustUserCoins,
  getDailyRewardConfig,
  getUsersCoins,
  updateDailyRewardConfig,
} from "@/modules/rewards";
import type { DailyRewardConfig, UserCoinItem } from "@/modules/rewards";

export function AdminCoinsPanel() {
  // Config state
  const [config, setConfig] = useState<DailyRewardConfig>({
    enabled: true,
    dayRewards: [1, 2, 3, 4, 5, 6, 7],
  });
  const [dayRewardsInput, setDayRewardsInput] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Users coin list state
  const [users, setUsers] = useState<UserCoinItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");

  // Modal / Adjust State
  const [adjustingUser, setAdjustingUser] = useState<UserCoinItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [isAdjusting, setIsAdjusting] = useState(false);

  async function loadData(searchKw = search) {
    try {
      const cfg = await getDailyRewardConfig();
      setConfig(cfg);
      setDayRewardsInput(cfg.dayRewards);
    } catch {
      message.error("Không thể tải cấu hình điểm danh.");
    }

    try {
      setIsLoadingUsers(true);
      const usersData = await getUsersCoins({ search: searchKw.trim() || undefined });
      setUsers(usersData.users);
    } catch {
      message.error("Không thể tải danh sách tài khoản xu.");
    } finally {
      setIsLoadingUsers(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const handleRewardChange = (index: number, val: number | null) => {
    const next = [...dayRewardsInput];
    next[index] = val ?? 0;
    setDayRewardsInput(next);
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const updated = await updateDailyRewardConfig({
        enabled: config.enabled,
        dayRewards: dayRewardsInput,
      });
      setConfig(updated);
      setDayRewardsInput(updated.dayRewards);
      message.success("Đã cập nhật cấu hình chuỗi điểm danh 7 ngày thành công!");
    } catch {
      message.error("Lưu cấu hình điểm danh thất bại.");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleConfirmAdjust = async () => {
    if (!adjustingUser) return;
    setIsAdjusting(true);
    try {
      const result = await adjustUserCoins({
        userId: adjustingUser.id,
        amount: adjustAmount,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === adjustingUser.id ? { ...u, coins: result.newCoins } : u))
      );
      message.success(`Đã điều chỉnh ${result.delta >= 0 ? `+${result.delta}` : result.delta} xu cho ${result.username} (Số dư mới: ${result.newCoins} xu)`);
      setAdjustingUser(null);
    } catch {
      message.error("Điều chỉnh xu thất bại.");
    } finally {
      setIsAdjusting(false);
    }
  };

  const columns: ColumnsType<UserCoinItem> = [
    {
      title: "Tài khoản",
      dataIndex: "username",
      key: "username",
      render: (username: string) => <span style={{ fontWeight: 600 }}>{username}</span>,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: 130,
      render: (role: string) => <Tag>{role}</Tag>,
    },
    {
      title: "Số xu hiện có",
      dataIndex: "coins",
      key: "coins",
      width: 150,
      sorter: (a, b) => a.coins - b.coins,
      render: (coins: number) => (
        <span>{coins.toLocaleString("vi-VN")} xu</span>
      ),
    },
    {
      title: "Điểm danh",
      dataIndex: ["_count", "dailyCheckIns"],
      key: "dailyCheckIns",
      width: 130,
      render: (_, record) => <span>{record._count?.dailyCheckIns || 0} lần</span>,
    },
    {
      title: "Bài học đã thưởng",
      dataIndex: ["_count", "lessonRewards"],
      key: "lessonRewards",
      width: 160,
      render: (_, record) => <span>{record._count?.lessonRewards || 0} bài</span>,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          size="small"
          icon={<DollarOutlined />}
          onClick={() => {
            setAdjustingUser(record);
            setAdjustAmount(10);
          }}
        >
          Sửa xu
        </Button>
      ),
    },
  ];

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 1. CẤU HÌNH ĐIỂM DANH */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "16px 20px", borderRadius: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
              Điểm danh 7 ngày
            </h3>
          </div>

          <Space size="middle" align="center">
            <Switch
              checked={config.enabled}
              onChange={(checked) => setConfig((prev) => ({ ...prev, enabled: checked }))}
              checkedChildren="Bật"
              unCheckedChildren="Tắt"
            />
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveConfig}
              loading={isSavingConfig}
            >
              Lưu
            </Button>
          </Space>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
          {dayRewardsInput.map((coins, idx) => (
            <div
              key={idx}
              style={{
                padding: "10px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
                Ngày {idx + 1}
              </span>
              <InputNumber
                min={0}
                max={10000}
                value={coins}
                onChange={(val) => handleRewardChange(idx, val)}
                style={{ width: "100%" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 2. BẢNG QUẢN LÝ XU TỪNG TÀI KHOẢN (ANTD TABLE FULL WIDTH) */}
      <div className="admin-table-container">
        <div className="admin-table-container__header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Input
              placeholder="Tìm tên đăng nhập..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={() => loadData(search)}
              style={{ width: 320 }}
              allowClear
            />
            <Button onClick={() => loadData(search)}>Tìm</Button>
          </div>
        </div>

        <Table<UserCoinItem>
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={isLoadingUsers}
          pagination={{
            pageSize: 12,
            showSizeChanger: true,
            showTotal: (total) => `Tổng cộng ${total} tài khoản`,
          }}
          scroll={{ x: 800, y: "calc(100vh - 440px)" }}
          style={{ width: "100%" }}
        />
      </div>

      {/* 3. MODAL ANTD ĐIỀU CHỈNH XU */}
      <Modal
        title={`Điều chỉnh xu: ${adjustingUser?.username}`}
        open={Boolean(adjustingUser)}
        onOk={handleConfirmAdjust}
        onCancel={() => setAdjustingUser(null)}
        confirmLoading={isAdjusting}
        okText="Lưu"
        cancelText="Hủy"
        width={400}
      >
        <div style={{ padding: "12px 0" }}>
          <p style={{ margin: "0 0 12px", fontSize: 14 }}>
            Số dư hiện tại: <strong>{adjustingUser?.coins} xu</strong>
          </p>
          <Form layout="vertical">
            <Form.Item
              label="Số lượng xu"
              extra="Số dương để cộng (+), số âm để trừ (-)"
            >
              <InputNumber
                value={adjustAmount}
                onChange={(val) => setAdjustAmount(val ?? 0)}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
