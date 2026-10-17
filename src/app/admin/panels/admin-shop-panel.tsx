"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckCircleFilled,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShoppingOutlined,
  InboxOutlined,
  UploadOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { CoinIcon } from "@/components/ui/coin-icon";
import {
  createShopItem,
  deleteShopItem,
  getAdminOrders,
  getAvailableShopAssets,
  getShopItems,
  updateOrderStatus,
  updateShopItem,
  type AvailableAsset,
  type CreateShopItemPayload,
  type ShopItem,
  type ShopOrder,
  type UpdateShopItemPayload,
} from "@/modules/shop";

const { Text } = Typography;

export function AdminShopPanel() {
  const [subTab, setSubTab] = useState<"items" | "orders">("items");

  // State danh sách sản phẩm
  const [items, setItems] = useState<ShopItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [itemSearch, setItemSearch] = useState("");

  // Danh sách ảnh trang bị có sẵn trong thư mục public/items
  const [availableAssets, setAvailableAssets] = useState<AvailableAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [selectedAssetUrl, setSelectedAssetUrl] = useState<string>("");

  // Modal thêm / sửa sản phẩm
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);
  const [form] = Form.useForm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý upload ảnh bên ngoài cho sản phẩm đặc biệt
  const handleUploadCustomImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      message.error("Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, WEBP, SVG...).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      message.error("Kích thước ảnh vượt quá 10MB. Vui lòng chọn ảnh nhẹ hơn.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      form.setFieldValue("imageUrl", base64String);
      setSelectedAssetUrl(base64String);
      message.success("Đã tải ảnh lên thành công!");
    };
    reader.onerror = () => {
      message.error("Không thể đọc file ảnh.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Modal chỉ xem chi tiết sản phẩm
  const [viewingItem, setViewingItem] = useState<ShopItem | null>(null);

  // State đơn hàng
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [orderSearch, setOrderSearch] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Load items
  async function loadItems() {
    try {
      setIsLoadingItems(true);
      const data = await getShopItems({ all: true });
      setItems(data);
    } catch {
      message.error("Không thể tải danh sách sản phẩm.");
    } finally {
      setIsLoadingItems(false);
    }
  }

  // Load danh sách ảnh có sẵn trong folder public/items
  async function loadAssets() {
    try {
      setIsLoadingAssets(true);
      const assets = await getAvailableShopAssets();
      setAvailableAssets(assets);
    } catch {
      // fallback
    } finally {
      setIsLoadingAssets(false);
    }
  }

  // Load orders
  async function loadOrders() {
    try {
      setIsLoadingOrders(true);
      const res = await getAdminOrders({
        status: orderStatusFilter === "ALL" ? undefined : orderStatusFilter,
        search: orderSearch.trim() || undefined,
      });
      setOrders(res.orders);
    } catch {
      message.error("Không thể tải danh sách đơn hàng.");
    } finally {
      setIsLoadingOrders(false);
    }
  }

  useEffect(() => {
    void loadItems();
    void loadOrders();
    void loadAssets();
  }, []);

  useEffect(() => {
    if (subTab === "orders") {
      void loadOrders();
    }
  }, [subTab, orderStatusFilter]);

  // Lọc sản phẩm theo tìm kiếm
  const filteredItems = useMemo(() => {
    if (!itemSearch.trim()) return items;
    const q = itemSearch.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  }, [items, itemSearch]);

  // Chọn ảnh có sẵn trong thư mục /items
  const handleSelectAsset = (asset: AvailableAsset) => {
    setSelectedAssetUrl(asset.url);
    form.setFieldValue("imageUrl", asset.url);
    // Nếu đang tạo mới thì tự động điền tên gợi ý của món đồ
    if (!editingItem) {
      form.setFieldValue("name", asset.name);
    }
  };

  // Mở modal tạo mới
  const handleOpenCreateModal = async () => {
    setEditingItem(null);
    form.resetFields();

    let assets = availableAssets;
    try {
      assets = await getAvailableShopAssets();
      setAvailableAssets(assets);
    } catch {}

    const firstAsset = assets[0];
    const initialUrl = firstAsset?.url || "/items/mask_matla.png";
    const initialName = firstAsset?.name || "";

    setSelectedAssetUrl(initialUrl);
    form.setFieldsValue({
      name: initialName,
      imageUrl: initialUrl,
      coinPrice: 10,
      isSpecial: false,
      stock: undefined,
    });
    setIsItemModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = async (item: ShopItem) => {
    setEditingItem(item);
    form.resetFields();
    try {
      const assets = await getAvailableShopAssets();
      setAvailableAssets(assets);
    } catch {}
    setSelectedAssetUrl(item.imageUrl);
    form.setFieldsValue({
      name: item.name,
      description: item.description || "",
      imageUrl: item.imageUrl,
      coinPrice: item.coinPrice,
      isSpecial: item.isSpecial,
      stock: item.stock === null ? undefined : item.stock,
    });
    setIsItemModalOpen(true);
  };

  // Submit Modal Thêm / Sửa sản phẩm
  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmittingItem(true);

      const payload: CreateShopItemPayload | UpdateShopItemPayload = {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        imageUrl: values.imageUrl.trim(),
        coinPrice: Number(values.coinPrice),
        isSpecial: Boolean(values.isSpecial),
        stock: values.stock === undefined || values.stock === null || values.stock === "" ? null : Number(values.stock),
      };

      if (editingItem) {
        const updated = await updateShopItem(editingItem.id, payload);
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        message.success(`Đã cập nhật sản phẩm "${updated.name}" thành công!`);
      } else {
        const created = await createShopItem(payload as CreateShopItemPayload);
        setItems((prev) => [created, ...prev]);
        message.success(`Đã thêm mới sản phẩm "${created.name}" thành công!`);
      }

      setIsItemModalOpen(false);
      form.resetFields();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) {
        return; // Validation errors handled by antd
      }
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Thao tác thất bại";
      message.error(msg || "Có lỗi xảy ra.");
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // Xóa sản phẩm
  const handleDeleteItem = async (item: ShopItem) => {
    try {
      await deleteShopItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      message.success(`Đã xóa sản phẩm "${item.name}".`);
    } catch {
      message.error("Xóa sản phẩm thất bại.");
    }
  };

  // Cập nhật trạng thái đơn hàng
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((ord) => (ord.id === orderId ? updated : ord)));
      message.success("Đã cập nhật trạng thái đơn hàng!");
    } catch {
      message.error("Cập nhật trạng thái thất bại.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Cấu hình cột bảng Sản phẩm (Antd Table)
  const itemColumns: ColumnsType<ShopItem> = [
    {
      title: "Ảnh",
      dataIndex: "imageUrl",
      key: "imageUrl",
      width: 70,
      render: (url: string, record) => (
        <div style={{ width: 44, height: 44, position: "relative", borderRadius: 6, overflow: "hidden", border: "1px solid #e2e8f0" }}>
          <Image
            src={url || "/images/news-steam-lab.jpg"}
            alt={record.name}
            fill
            sizes="44px"
            style={{ objectFit: "cover" }}
            unoptimized
          />
        </div>
      ),
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      key: "name",
      render: (name: string, record) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
          {record.description && (
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: "Giá xu",
      dataIndex: "coinPrice",
      key: "coinPrice",
      width: 120,
      sorter: (a, b) => a.coinPrice - b.coinPrice,
      render: (price: number) => (
        <span>
          <CoinIcon size={14} /> {price.toLocaleString("vi-VN")} xu
        </span>
      ),
    },
    {
      title: "Phân loại",
      dataIndex: "isSpecial",
      key: "isSpecial",
      width: 130,
      filters: [
        { text: "Đặc biệt", value: true },
        { text: "Thường", value: false },
      ],
      onFilter: (value, record) => record.isSpecial === value,
      render: (isSpecial: boolean) =>
        isSpecial ? (
          <Tag>Đặc biệt</Tag>
        ) : (
          <Tag>Thường</Tag>
        ),
    },
    {
      title: "Tồn kho",
      dataIndex: "stock",
      key: "stock",
      width: 110,
      render: (stock: number | null) =>
        stock === null ? (
          <span>Vô hạn</span>
        ) : (
          <span>{stock.toLocaleString("vi-VN")}</span>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setViewingItem(record)}
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
            title="Xác nhận xóa"
            description={`Bạn có chắc muốn xóa "${record.name}" khỏi cửa hàng?`}
            onConfirm={() => handleDeleteItem(record)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Cấu hình cột bảng Đơn hàng (Antd Table)
  const orderColumns: ColumnsType<ShopOrder> = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date: string) => (
        <span style={{ fontSize: 12, color: "#64748b" }}>
          {new Date(date).toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: "Người mua",
      dataIndex: ["user", "username"],
      key: "username",
      width: 140,
      render: (_, record) => (
        <span style={{ fontWeight: 700 }}>{record.user?.username || record.userId}</span>
      ),
    },
    {
      title: "Vật phẩm",
      key: "item",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {record.item?.imageUrl && (
            <div style={{ width: 36, height: 36, position: "relative", borderRadius: 4, overflow: "hidden", border: "1px solid #e2e8f0", flexShrink: 0 }}>
              <Image src={record.item.imageUrl} alt="" fill sizes="36px" style={{ objectFit: "cover" }} unoptimized />
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700 }}>
              {record.item?.name || "Vật phẩm"}
              {record.isSpecial && (
                <Tag style={{ marginLeft: 6, fontSize: 10 }}>
                  Đặc biệt
                </Tag>
              )}
            </div>
            {record.note && (
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Ghi chú: {record.note}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Giá trừ",
      dataIndex: "coinPrice",
      key: "coinPrice",
      width: 100,
      render: (price: number) => (
        <span>
          <CoinIcon size={14} /> {price} xu
        </span>
      ),
    },
    {
      title: "Thông tin liên lạc",
      dataIndex: "contactInfo",
      key: "contactInfo",
      width: 250,
      render: (contact: string | null) =>
        contact ? (
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "4px 8px", borderRadius: 4 }}>
            <Text copyable style={{ fontSize: 13, fontWeight: 600 }}>
              {contact}
            </Text>
          </div>
        ) : (
          <span style={{ color: "#94a3b8" }}>—</span>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => {
        switch (status) {
          case "PENDING":
            return <Tag>Chờ xử lý</Tag>;
          case "PROCESSING":
            return <Tag>Đang xử lý</Tag>;
          case "COMPLETED":
            return <Tag>Đã hoàn thành</Tag>;
          case "CANCELLED":
            return <Tag>Đã hủy</Tag>;
          default:
            return <Tag>{status}</Tag>;
        }
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 160,
      fixed: "right",
      render: (_, record) => (
        <Select
          size="small"
          value={record.status}
          loading={updatingOrderId === record.id}
          disabled={updatingOrderId === record.id}
          onChange={(newVal) => handleStatusChange(record.id, newVal)}
          style={{ width: "100%" }}
          options={[
            { value: "PENDING", label: "Chờ xử lý" },
            { value: "PROCESSING", label: "Đang xử lý" },
            { value: "COMPLETED", label: "Đã hoàn thành" },
            { value: "CANCELLED", label: "Đã hủy" },
          ]}
        />
      ),
    },
  ];

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* THANH CHUYỂN TAB CON (SẢN PHẨM / ĐƠN HÀNG) */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #e2e8f0", paddingBottom: 8 }}>
        <Button
          type={subTab === "items" ? "primary" : "default"}
          icon={<ShoppingOutlined />}
          onClick={() => setSubTab("items")}
        >
          Sản phẩm
        </Button>
        <Button
          type={subTab === "orders" ? "primary" : "default"}
          icon={<InboxOutlined />}
          onClick={() => setSubTab("orders")}
        >
          Đơn hàng
        </Button>
      </div>

      {/* ======================================================== */}
      {/* 1. VIEW DANH SÁCH SẢN PHẨM (TABLE ANTD FULL MÀN HÌNH)      */}
      {/* ======================================================== */}
      {subTab === "items" && (
        <div className="admin-table-container">
          <div className="admin-table-container__header">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Input
                placeholder="Tìm sản phẩm..."
                prefix={<SearchOutlined />}
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                style={{ width: 320 }}
                allowClear
              />
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

          <Table<ShopItem>
            columns={itemColumns}
            dataSource={filteredItems}
            rowKey="id"
            loading={isLoadingItems}
            pagination={{
              pageSize: 12,
              showSizeChanger: true,
              pageSizeOptions: ["10", "12", "20", "50"],
              showTotal: (total) => `Tổng cộng ${total} sản phẩm`,
            }}
            scroll={{ x: 950, y: "calc(100vh - 290px)" }}
            style={{ width: "100%" }}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. VIEW ĐƠN HÀNG NGƯỜI DÙNG (TABLE ANTD FULL MÀN HÌNH)    */}
      {/* ======================================================== */}
      {subTab === "orders" && (
        <div className="admin-table-container">
          <div className="admin-table-container__header">
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <Select
                value={orderStatusFilter}
                onChange={setOrderStatusFilter}
                style={{ width: 170 }}
                options={[
                  { value: "ALL", label: "-- Tất cả trạng thái --" },
                  { value: "PENDING", label: "Chờ xử lý" },
                  { value: "PROCESSING", label: "Đang xử lý" },
                  { value: "COMPLETED", label: "Đã hoàn thành" },
                  { value: "CANCELLED", label: "Đã hủy" },
                ]}
              />
              <Input
                placeholder="Tìm người mua..."
                prefix={<SearchOutlined />}
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                onPressEnter={loadOrders}
                style={{ width: 320 }}
                allowClear
              />
            </div>

            <div className="admin-table-container__actions">
              <Button icon={<ReloadOutlined />} onClick={loadOrders} loading={isLoadingOrders}>
                Làm mới
              </Button>
            </div>
          </div>

          <Table<ShopOrder>
            columns={orderColumns}
            dataSource={orders}
            rowKey="id"
            loading={isLoadingOrders}
            pagination={{
              pageSize: 12,
              showSizeChanger: true,
              pageSizeOptions: ["10", "12", "20", "50"],
              showTotal: (total) => `Tổng cộng ${total} đơn hàng`,
            }}
            scroll={{ x: 1050, y: "calc(100vh - 290px)" }}
            style={{ width: "100%" }}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL ANTD: THÊM MỚI / CHỈNH SỬA SẢN PHẨM                */}
      {/* ======================================================== */}
      <Modal
        title={editingItem ? "Sửa sản phẩm" : "Thêm sản phẩm"}
        open={isItemModalOpen}
        onOk={handleModalSubmit}
        onCancel={() => setIsItemModalOpen(false)}
        confirmLoading={isSubmittingItem}
        okText="Lưu"
        cancelText="Hủy"
        width={680}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          {/* 1. CHỌN LOẠI SẢN PHẨM: ĐẶC BIỆT HOẶC THƯỜNG */}
          <Form.Item
            name="isSpecial"
            label="Loại sản phẩm"
            valuePropName="checked"
            style={{ marginBottom: 14 }}
          >
            <Switch
              checkedChildren="ĐẶC BIỆT"
              unCheckedChildren="Thường"
              onChange={(checked) => {
                if (!checked) {
                  const current = form.getFieldValue("imageUrl");
                  if (!current || !current.startsWith("/items/")) {
                    const fallbackUrl = availableAssets[0]?.url || "/items/mask_matla.png";
                    form.setFieldValue("imageUrl", fallbackUrl);
                    setSelectedAssetUrl(fallbackUrl);
                  }
                }
              }}
            />
          </Form.Item>

          {/* 2. KHU VỰC CHỌN / NHẬP ẢNH TÙY THEO LOẠI SẢN PHẨM */}
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.isSpecial !== curr.isSpecial || prev.imageUrl !== curr.imageUrl}>
            {({ getFieldValue }) => {
              const isSpecial = getFieldValue("isSpecial");
              const currentUrl = getFieldValue("imageUrl") || selectedAssetUrl;

              if (isSpecial) {
                // CHẾ ĐỘ SẢN PHẨM ĐẶC BIỆT: ĐƯỢC THÊM ẢNH NGOÀI HOẶC TẢI TỪ MÁY
                return (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                        Ảnh sản phẩm đặc biệt (nhập link ngoài hoặc tải từ máy):
                      </span>
                      {currentUrl && (
                        <Button
                          size="small"
                          danger
                          type="link"
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            form.setFieldValue("imageUrl", "");
                            setSelectedAssetUrl("");
                          }}
                        >
                          Gỡ ảnh
                        </Button>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        padding: 12,
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        background: "#f8fafc",
                      }}
                    >
                      <div style={{ display: "flex", gap: 8 }}>
                        <Form.Item
                          name="imageUrl"
                          style={{ flex: 1, margin: 0 }}
                          rules={[{ required: true, message: "Vui lòng nhập đường dẫn ảnh hoặc tải ảnh lên" }]}
                        >
                          <Input
                            placeholder="Nhập link ảnh ngoài (https://... hoặc /images/...)"
                            prefix={<LinkOutlined style={{ color: "#94a3b8" }} />}
                            allowClear
                            onChange={(e) => setSelectedAssetUrl(e.target.value)}
                          />
                        </Form.Item>
                        <Button
                          icon={<UploadOutlined />}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Tải ảnh từ máy
                        </Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleUploadCustomImage}
                        />
                      </div>

                      {/* Khung Preview xem trước ảnh */}
                      {currentUrl && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: 8,
                            background: "#fff",
                            borderRadius: 6,
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <div
                            style={{
                              width: 52,
                              height: 52,
                              position: "relative",
                              borderRadius: 6,
                              overflow: "hidden",
                              border: "1px solid #cbd5e1",
                              flexShrink: 0,
                              background: "#f1f5f9",
                            }}
                          >
                            <Image
                              src={currentUrl}
                              alt="Ảnh xem trước"
                              fill
                              sizes="52px"
                              style={{ objectFit: "contain" }}
                              unoptimized
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#334155" }}>
                              Xem trước ảnh sản phẩm đặc biệt
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#64748b",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {currentUrl.startsWith("data:") ? "Ảnh tải lên từ máy tính (Base64)" : currentUrl}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // CHẾ ĐỘ SẢN PHẨM THƯỜNG: CHỈ LẤY ẢNH TRONG PUBLIC/ITEMS
              return (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                      Ảnh sản phẩm (chỉ lấy từ thư mục <code style={{ color: "#2563eb", background: "#eff6ff", padding: "2px 6px", borderRadius: 4 }}>public/items</code>):
                    </span>
                    <Button size="small" type="link" icon={<ReloadOutlined />} onClick={loadAssets} loading={isLoadingAssets}>
                      Quét lại ảnh
                    </Button>
                  </div>

                  {availableAssets.length === 0 ? (
                    <div style={{ padding: "16px", background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1", textAlign: "center", color: "#64748b" }}>
                      Đang quét hoặc chưa có file ảnh nào trong thư mục <code>public/items</code>.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                        gap: 10,
                        maxHeight: 230,
                        overflowY: "auto",
                        padding: 8,
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        background: "#f8fafc",
                      }}
                    >
                      {availableAssets.map((asset) => {
                        const isSelected = selectedAssetUrl === asset.url;
                        return (
                          <div
                            key={asset.url}
                            onClick={() => handleSelectAsset(asset)}
                            style={{
                              position: "relative",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              padding: "8px 6px",
                              borderRadius: 8,
                              background: "#fff",
                              border: isSelected ? "2px solid #22c55e" : "1px solid #e2e8f0",
                              boxShadow: isSelected ? "0 2px 8px rgba(34, 197, 94, 0.25)" : "none",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              textAlign: "center",
                            }}
                          >
                            {isSelected && (
                              <CheckCircleFilled
                                style={{
                                  position: "absolute",
                                  top: 4,
                                  right: 4,
                                  color: "#22c55e",
                                  fontSize: 16,
                                  background: "#fff",
                                  borderRadius: "50%",
                                }}
                              />
                            )}
                            <div style={{ width: 52, height: 52, position: "relative", marginBottom: 6 }}>
                              <Image
                                src={asset.url}
                                alt={asset.name}
                                fill
                                sizes="52px"
                                style={{ objectFit: "contain" }}
                                unoptimized
                              />
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: isSelected ? "#15803d" : "#334155",
                                lineHeight: 1.2,
                                maxWidth: "100%",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={asset.name}
                            >
                              {asset.name}
                            </div>
                            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, fontFamily: "monospace" }}>
                              {asset.filename}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Xem trước ảnh đã chọn */}
                  {selectedAssetUrl && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginTop: 10,
                        padding: "8px 12px",
                        background: "#fff",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          position: "relative",
                          borderRadius: 6,
                          overflow: "hidden",
                          border: "1px solid #cbd5e1",
                          flexShrink: 0,
                          background: "#f1f5f9",
                        }}
                      >
                        <Image
                          src={selectedAssetUrl}
                          alt="Ảnh xem trước"
                          fill
                          sizes="44px"
                          style={{ objectFit: "contain" }}
                          unoptimized
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#334155" }}>
                          Ảnh đã chọn: <code style={{ color: "#2563eb" }}>{selectedAssetUrl}</code>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Input imageUrl ẩn - tự động bind khi chọn ảnh */}
                  <Form.Item
                    name="imageUrl"
                    rules={[{ required: true, message: "Vui lòng chọn một ảnh vật phẩm trong public/items" }]}
                    hidden
                  >
                    <Input />
                  </Form.Item>
                </div>
              );
            }}
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên sản phẩm"
            rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}
          >
            <Input placeholder="Ví dụ: Kính Tri thức STEAM" />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item
              name="coinPrice"
              label="Giá xu"
              rules={[{ required: true, message: "Vui lòng nhập giá xu" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} placeholder="10" />
            </Form.Item>

            <Form.Item
              name="stock"
              label="Số lượng tồn kho"
              extra="Bỏ trống nếu số lượng là vô hạn"
            >
              <InputNumber min={0} style={{ width: "100%" }} placeholder="Vô hạn" />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Mô tả sản phẩm">
            <Input.TextArea rows={3} placeholder="Mô tả tính năng, quà tặng hoặc hướng dẫn nhận..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL CHỈ XEM NỘI DUNG SẢN PHẨM (READ-ONLY) */}
      <Modal
        title="Chi tiết sản phẩm"
        open={Boolean(viewingItem)}
        onCancel={() => setViewingItem(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setViewingItem(null)}>
            Đóng
          </Button>,
        ]}
        width={560}
      >
        {viewingItem && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
            {viewingItem.imageUrl && (
              <div style={{ width: "100%", height: 180, borderRadius: 6, overflow: "hidden", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
                <img src={viewingItem.imageUrl} alt={viewingItem.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
              </div>
            )}
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{viewingItem.name}</div>
              <div style={{ fontSize: 14, color: "#b45309", fontWeight: 700, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                <CoinIcon size={16} /> {viewingItem.coinPrice.toLocaleString("vi-VN")} xu
              </div>
              <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 4, display: "flex", gap: 6, alignItems: "center" }}>
                {viewingItem.isSpecial && <Tag color="gold">Đặc biệt</Tag>}
                {viewingItem.stock !== null && viewingItem.stock !== undefined && (
                  <span>Tồn kho: {viewingItem.stock}</span>
                )}
                <Tag color={viewingItem.isActive ? "green" : "default"}>
                  {viewingItem.isActive ? "Đang bán" : "Tạm ngưng"}
                </Tag>
              </div>
            </div>
            {viewingItem.description && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>Mô tả:</div>
                <div style={{ padding: 12, background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13.5, color: "#334155" }}>
                  {viewingItem.description}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
