"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
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
  PictureOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { createRoom, deleteRoom, getRooms, updateRoom } from "@/modules/lessons";
import type { Room, RoomPayload } from "@/modules/lessons";

export function AdminRoomsPanel() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal thêm / sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal chỉ xem chi tiết phòng học
  const [viewingRoom, setViewingRoom] = useState<Room | null>(null);

  async function loadRooms() {
    setIsLoading(true);
    try {
      setRooms(await getRooms());
    } catch {
      message.error("Không thể tải danh sách cấp độ phòng học.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRooms();
  }, []);

  const handleOpenCreateModal = () => {
    if (rooms.length >= 4) {
      message.warning("Hệ thống chỉ hỗ trợ tối đa 4 cấp độ (từ Lớp 6 đến Lớp 9).");
      return;
    }
    setEditingRoom(null);
    setImageUrl("");
    form.resetFields();
    form.setFieldsValue({
      name: `Lớp ${6 + rooms.length}`,
      order: rooms.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (room: Room) => {
    setEditingRoom(room);
    setImageUrl(room.imageUrl || "");
    form.resetFields();
    form.setFieldsValue({
      name: room.name,
      order: room.order,
    });
    setIsModalOpen(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      message.error("Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, WEBP, SVG...).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      message.error("Kích thước ảnh vượt quá 15MB. Vui lòng chọn ảnh nhẹ hơn.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setImageUrl(base64String);
      message.success("Đã chọn ảnh thành công (định dạng Base64)!");
    };
    reader.onerror = () => {
      message.error("Không thể đọc file ảnh.");
    };
    reader.readAsDataURL(file);

    // Reset input để có thể chọn lại file cùng tên nếu muốn
    e.target.value = "";
  };

  const handleClearImage = () => {
    setImageUrl("");
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      const finalImageUrl = imageUrl.trim();

      const payload: RoomPayload = {
        name: values.name.trim(),
        order: Number(values.order),
        imageUrl: finalImageUrl,
      };

      if (editingRoom) {
        const updated = await updateRoom(editingRoom.id, payload);
        setRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        message.success(`Đã cập nhật "${updated.name}" thành công!`);
      } else {
        const created = await createRoom(payload);
        setRooms((prev) => [...prev, created]);
        message.success(`Đã tạo "${created.name}" thành công!`);
      }

      setIsModalOpen(false);
      form.resetFields();
      setImageUrl("");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) {
        return;
      }
      message.error("Có lỗi xảy ra khi lưu phòng học.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoom = async (room: Room) => {
    try {
      await deleteRoom(room.id);
      setRooms((prev) => prev.filter((r) => r.id !== room.id));
      message.success(`Đã xóa phòng "${room.name}".`);
    } catch {
      message.error("Không thể xóa phòng học này.");
    }
  };

  const columns: ColumnsType<Room> = [
    {
      title: "Ảnh phòng",
      dataIndex: "imageUrl",
      key: "imageUrl",
      width: 100,
      align: "center",
      render: (img: string | null, record: Room) =>
        img ? (
          <img
            src={img}
            alt={record.name}
            style={{
              width: 54,
              height: 54,
              objectFit: "cover",
              borderRadius: 6,
              border: "1px solid #e2e8f0",
              display: "inline-block",
            }}
          />
        ) : (
          <Tag color="default">Chưa có ảnh</Tag>
        ),
    },
    {
      title: "Phòng học",
      dataIndex: "name",
      key: "name",
      render: (name: string) => <span style={{ fontWeight: 700, fontSize: 15 }}>{name}</span>,
    },
    {
      title: "Thứ tự",
      dataIndex: "order",
      key: "order",
      width: 100,
      render: (order: number) => <span>#{order}</span>,
    },
    {
      title: "Số bài học",
      dataIndex: ["_count", "lessons"],
      key: "lessonsCount",
      width: 150,
      render: (_, record) => (
        <span style={{ fontWeight: 600 }}>{record._count?.lessons || 0} bài</span>
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
            onClick={() => setViewingRoom(record)}
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
            description={`Bạn có chắc muốn xóa "${record.name}"? Tất cả bài học thuộc phòng này sẽ bị xóa theo.`}
            onConfirm={() => handleDeleteRoom(record)}
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

  return (
    <div className="admin-table-container">
      <div className="admin-table-container__header" style={{ justifyContent: "flex-end" }}>
        <div className="admin-table-container__actions">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreateModal}
            disabled={rooms.length >= 4}
            size="middle"
          >
            Thêm
          </Button>
        </div>
      </div>

      <Table<Room>
        columns={columns}
        dataSource={rooms}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        scroll={{ x: 650 }}
        style={{ width: "100%" }}
      />

      <Modal
        title={editingRoom ? "Sửa phòng" : "Thêm phòng"}
        open={isModalOpen}
        onOk={handleModalSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={isSubmitting}
        okText="Lưu"
        cancelText="Hủy"
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Tên phòng (Lớp)"
            rules={[{ required: true, message: "Vui lòng nhập tên phòng" }]}
          >
            <Input placeholder="Ví dụ: Lớp 6" />
          </Form.Item>

          <Form.Item
            name="order"
            label="Thứ tự hiển thị"
            rules={[{ required: true, message: "Vui lòng nhập số thứ tự" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          {/* VÙNG THÊM ẢNH LƯU BASE64 */}
          <Form.Item label="Hình ảnh phòng học (Lưu Base64)">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageFileChange}
            />

            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Button
                  type="dashed"
                  icon={<UploadOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ flex: 1, height: 40, fontWeight: 500 }}
                >
                  Chọn ảnh từ máy tính (lưu Base64)
                </Button>
                {imageUrl && (
                  <Button danger icon={<DeleteOutlined />} onClick={handleClearImage}>
                    Gỡ ảnh
                  </Button>
                )}
              </div>

              {/* Xem trước ảnh */}
              {imageUrl ? (
                <div
                  style={{
                    position: "relative",
                    borderRadius: 8,
                    border: "1px dashed #94a3b8",
                    padding: 10,
                    background: "#f8fafc",
                    textAlign: "center",
                  }}
                >
                  <img
                    src={imageUrl}
                    alt="Xem trước ảnh phòng học"
                    style={{
                      maxHeight: 180,
                      maxWidth: "100%",
                      borderRadius: 6,
                      objectFit: "contain",
                      display: "block",
                      margin: "0 auto",
                    }}
                  />
                  <div style={{ marginTop: 8 }}>
                    {imageUrl.startsWith("data:") ? (
                      <Tag color="green">Ảnh Base64 (sẵn sàng lưu)</Tag>
                    ) : (
                      <Tag color="blue">Đường dẫn URL ảnh</Tag>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    border: "1px dashed #cbd5e1",
                    borderRadius: 8,
                    padding: "20px 12px",
                    textAlign: "center",
                    color: "#94a3b8",
                    background: "#f8fafc",
                  }}
                >
                  <PictureOutlined style={{ fontSize: 28, marginBottom: 6, display: "block" }} />
                  <span>Chưa có ảnh. Bấm nút phía trên để tải ảnh lên (lưu Base64)</span>
                </div>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL CHỈ XEM NỘI DUNG PHÒNG HỌC (READ-ONLY) */}
      <Modal
        title="Chi tiết phòng học"
        open={Boolean(viewingRoom)}
        onCancel={() => setViewingRoom(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setViewingRoom(null)}>
            Đóng
          </Button>,
        ]}
        width={560}
      >
        {viewingRoom && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
            {viewingRoom.imageUrl && (
              <div style={{ width: "100%", height: 180, borderRadius: 6, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                <img src={viewingRoom.imageUrl} alt={viewingRoom.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{viewingRoom.name}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                Thứ tự: <strong>{viewingRoom.order}</strong> • Số bài học: <strong>{viewingRoom._count?.lessons ?? 0}</strong>
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                Ngày tạo: {new Date(viewingRoom.createdAt).toLocaleDateString("vi-VN")}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
