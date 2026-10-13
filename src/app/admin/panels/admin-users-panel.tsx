"use client";

import { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  type CreateUserPayload,
  type UpdateUserPayload,
  type User,
  type UserRoleValue,
} from "@/modules/users";

const PAGE_SIZE = 15;

interface AdminUsersPanelProps {
  currentUserId: string;
}

export function AdminUsersPanel({ currentUserId }: AdminUsersPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0 });
  const [keyword, setKeyword] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal thêm / sửa user
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Modal chỉ xem chi tiết tài khoản
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Load data
  async function loadData(page = meta.page, searchKw = keyword) {
    setIsLoading(true);
    try {
      const usersResult = await getUsers({ page, pageSize: PAGE_SIZE, keyword: searchKw });
      setUsers(usersResult.data);
      setMeta(usersResult.meta);
    } catch {
      message.error("Không thể tải danh sách người dùng.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData(meta.page, keyword);
  }, [meta.page, keyword]);

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({
      role: "MEMBER",
      gender: "MALE",
    });
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    form.resetFields();
    form.setFieldsValue({
      username: user.username,
      role: user.role,
      gender: user.gender || "MALE",
      password: "",
    });
    setIsModalOpen(true);
  };

  // Submit Modal Thêm / Sửa
  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      if (editingUser) {
        // Cập nhật người dùng
        const payload: UpdateUserPayload = {
          role: values.role as UserRoleValue,
          gender: values.gender,
        };
        if (values.password && values.password.trim()) {
          payload.password = values.password.trim();
        }

        const updated = await updateUser(editingUser.id, payload);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        message.success(`Đã cập nhật tài khoản "${updated.username}" thành công!`);
      } else {
        // Tạo mới người dùng
        const payload: CreateUserPayload = {
          username: values.username.trim(),
          password: values.password.trim(),
          role: values.role as UserRoleValue,
          gender: values.gender,
        };

        const created = await createUser(payload);
        setUsers((prev) => [created, ...prev]);
        setMeta((prev) => ({ ...prev, total: prev.total + 1 }));
        message.success(`Đã tạo tài khoản "${created.username}" thành công!`);
      }

      setIsModalOpen(false);
      form.resetFields();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) {
        return;
      }
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Thao tác thất bại";
      message.error(msg || "Có lỗi xảy ra khi lưu người dùng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xóa tài khoản
  const handleDeleteUser = async (user: User) => {
    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setMeta((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      message.success(`Đã xóa tài khoản "${user.username}".`);
    } catch {
      message.error("Xóa tài khoản thất bại.");
    }
  };

  // Columns Antd Table
  const columns: ColumnsType<User> = [
    {
      title: "Tài khoản",
      dataIndex: "username",
      key: "username",
      render: (username: string, record) => {
        const isSelf = record.id === currentUserId;
        return (
          <Space>
            <Avatar style={{ backgroundColor: "#2563eb" }}>
              {username.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {username}
                {isSelf && (
                  <Tag style={{ marginLeft: 6, fontSize: 11 }}>
                    Bạn
                  </Tag>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>ID: {record.id.slice(0, 8)}...</div>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
      width: 120,
      render: (gender: string | null) => {
        if (gender === "MALE") return <Tag>Nam</Tag>;
        if (gender === "FEMALE") return <Tag>Nữ</Tag>;
        if (gender === "OTHER") return <Tag>Khác</Tag>;
        return <Tag>Chưa rõ</Tag>;
      },
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: 130,
      render: (role: string) =>
        role === "ADMIN" ? (
          <Tag>Admin</Tag>
        ) : (
          <Tag>Thành viên</Tag>
        ),
    },
    {
      title: "Số xu",
      dataIndex: "coins",
      key: "coins",
      width: 130,
      sorter: (a, b) => (a.coins ?? 0) - (b.coins ?? 0),
      render: (coins: number) => (
        <span>{(coins ?? 0).toLocaleString("vi-VN")} xu</span>
      ),
    },
    {
      title: "Ngày tham gia",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (date: string) => (
        <span style={{ fontSize: 12, color: "#64748b" }}>
          {new Date(date).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record) => {
        const isSelf = record.id === currentUserId;
        return (
          <Space size="small">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setViewingUser(record)}
            >
              Xem
            </Button>
            <Button
              type="primary"
              ghost
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEditModal(record)}
            >
              Sửa
            </Button>
            <Popconfirm
              title="Xác nhận xóa tài khoản"
              description={`Bạn có chắc muốn xóa tài khoản "${record.username}"? Dữ liệu không thể khôi phục.`}
              onConfirm={() => handleDeleteUser(record)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              disabled={isSelf}
            >
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                disabled={isSelf}
                title={isSelf ? "Không thể xóa chính tài khoản đang đăng nhập" : undefined}
              >
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* BẢNG QUẢN LÝ NGƯỜI DÙNG ANTD DÀI FULL VÀ CAO FULL */}
      <div className="admin-table-container">
        <div className="admin-table-container__header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Input
              placeholder="Tìm tài khoản..."
              prefix={<SearchOutlined />}
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onPressEnter={() => {
                setMeta((prev) => ({ ...prev, page: 1 }));
                setKeyword(keywordInput.trim());
              }}
              style={{ width: 320 }}
              allowClear
            />
            <Button
              onClick={() => {
                setMeta((prev) => ({ ...prev, page: 1 }));
                setKeyword(keywordInput.trim());
              }}
            >
              Tìm
            </Button>
          </div>

          {/* NÚT THÊM MỚI Ở GÓC PHÍA TRÊN BÊN PHẢI */}
          <div className="admin-table-container__actions">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateModal}
              size="middle"
            >
              Thêm
            </Button>
          </div>
        </div>

        <Table<User>
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: meta.page,
            pageSize: meta.pageSize,
            total: meta.total,
            showTotal: (total) => `Tổng cộng ${total} tài khoản`,
            onChange: (page) => setMeta((prev) => ({ ...prev, page })),
          }}
          scroll={{ x: 900, y: "calc(100vh - 420px)" }}
          style={{ width: "100%" }}
        />
      </div>

      {/* 3. MODAL ANTD: THÊM MỚI / CHỈNH SỬA TÀI KHOẢN */}
      <Modal
        title={editingUser ? "Sửa tài khoản" : "Thêm tài khoản"}
        open={isModalOpen}
        onOk={handleModalSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={isSubmitting}
        okText="Lưu"
        cancelText="Hủy"
        width={500}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[
              { required: !editingUser, message: "Vui lòng nhập tên đăng nhập" },
              { min: 3, message: "Tên đăng nhập tối thiểu 3 ký tự" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Ví dụ: student01"
              disabled={Boolean(editingUser)}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={editingUser ? "Mật khẩu mới (bỏ trống nếu không đổi)" : "Mật khẩu"}
            rules={[
              { required: !editingUser, message: "Vui lòng nhập mật khẩu" },
              { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
            ]}
          >
            <Input.Password placeholder={editingUser ? "Nhập mật khẩu mới nếu muốn đổi..." : "Tối thiểu 6 ký tự"} />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item
              name="gender"
              label="Giới tính"
              rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}
            >
              <Select
                options={[
                  { value: "MALE", label: "Nam" },
                  { value: "FEMALE", label: "Nữ" },
                  { value: "OTHER", label: "Khác" },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="role"
              label="Vai trò"
              rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
            >
              <Select
                options={[
                  { value: "MEMBER", label: "Thành viên (MEMBER)" },
                  { value: "ADMIN", label: "Quản trị viên (ADMIN)" },
                ]}
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* MODAL CHỈ XEM NỘI DUNG TÀI KHOẢN (READ-ONLY) */}
      <Modal
        title="Chi tiết tài khoản"
        open={Boolean(viewingUser)}
        onCancel={() => setViewingUser(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setViewingUser(null)}>
            Đóng
          </Button>,
        ]}
        width={520}
      >
        {viewingUser && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700 }}>
                {viewingUser.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{viewingUser.username}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>ID: {viewingUser.id}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: 12, background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
              <div><span style={{ fontSize: 12, color: "#94a3b8" }}>Chuỗi ngày:</span> <div style={{ fontSize: 13.5, fontWeight: 500 }}>{viewingUser.streak ?? 0} ngày</div></div>
              <div><span style={{ fontSize: 12, color: "#94a3b8" }}>Vai trò:</span> <div style={{ fontSize: 13.5, fontWeight: 500 }}><Tag>{viewingUser.role}</Tag></div></div>
              <div><span style={{ fontSize: 12, color: "#94a3b8" }}>Số xu:</span> <div style={{ fontSize: 13.5, fontWeight: 600, color: "#2563eb" }}>{(viewingUser.coins ?? 0).toLocaleString("vi-VN")} xu</div></div>
              <div><span style={{ fontSize: 12, color: "#94a3b8" }}>Giới tính:</span> <div style={{ fontSize: 13.5, fontWeight: 500 }}>{viewingUser.gender || "Chưa rõ"}</div></div>
              <div style={{ gridColumn: "span 2" }}><span style={{ fontSize: 12, color: "#94a3b8" }}>Ngày tham gia:</span> <div style={{ fontSize: 13, color: "#475569" }}>{new Date(viewingUser.createdAt).toLocaleString("vi-VN")}</div></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
