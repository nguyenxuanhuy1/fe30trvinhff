"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
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
  PictureOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  createLesson,
  deleteLesson,
  getLesson,
  getLessons,
  getRooms,
  updateLesson,
} from "@/modules/lessons";
import type { Lesson, LessonPayload, Room } from "@/modules/lessons";

export function AdminLessonsPanel() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState<string>("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);

  // Modal thêm / sửa bài học
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal chỉ xem chi tiết bài học
  const [viewingLesson, setViewingLesson] = useState<(Lesson & { html?: string }) | null>(null);
  const [isLoadingView, setIsLoadingView] = useState(false);

  const handleOpenViewModal = async (record: Lesson) => {
    setIsLoadingView(true);
    try {
      const detail = await getLesson(record.id);
      setViewingLesson(detail);
    } catch {
      setViewingLesson(record);
    } finally {
      setIsLoadingView(false);
    }
  };

  useEffect(() => {
    async function loadRooms() {
      try {
        const data = await getRooms();
        setRooms(data);
        if (data.length > 0 && !roomId) {
          setRoomId(data[0].id);
        }
      } catch {
        message.error("Không thể tải danh sách cấp độ phòng học.");
      } finally {
        setIsLoadingRooms(false);
      }
    }

    void loadRooms();
  }, []);

  useEffect(() => {
    if (!roomId) {
      setLessons([]);
      return;
    }

    async function loadLessons() {
      setIsLoadingLessons(true);
      try {
        setLessons(await getLessons(roomId));
      } catch {
        message.error("Không thể tải danh sách bài học của cấp độ này.");
      } finally {
        setIsLoadingLessons(false);
      }
    }

    void loadLessons();
  }, [roomId]);

  const handleOpenCreateModal = () => {
    if (!roomId) {
      message.warning("Vui lòng chọn cấp độ phòng học trước khi thêm bài học.");
      return;
    }
    setEditingLesson(null);
    setImageUrl("");
    form.resetFields();
    form.setFieldsValue({
      name: `Bài học ${lessons.length + 1}`,
      order: lessons.length + 1,
      html: "<!doctype html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <title>Bài học</title>\n</head>\n<body>\n  <h1>Nội dung bài học mới</h1>\n</body>\n</html>",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (lesson: Lesson) => {
    setEditingLesson(lesson);
    setImageUrl(lesson.imageUrl || "");
    form.resetFields();
    try {
      const detail = await getLesson(lesson.id);
      setImageUrl(detail.imageUrl || lesson.imageUrl || "");
      form.setFieldsValue({
        name: lesson.name,
        order: lesson.order,
        html: detail.html || "",
      });
      setIsModalOpen(true);
    } catch {
      message.error("Không tải được chi tiết bài học.");
    }
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

      const payload: LessonPayload = {
        name: values.name.trim(),
        order: Number(values.order),
        html: values.html,
        imageUrl: finalImageUrl,
      };

      if (editingLesson) {
        await updateLesson(editingLesson.id, payload);
        setLessons((prev) =>
          prev.map((l) =>
            l.id === editingLesson.id
              ? { ...l, ...payload, imageUrl: finalImageUrl || null }
              : l
          )
        );
        message.success(`Đã cập nhật bài học "${payload.name}" thành công!`);
      } else {
        const created = await createLesson(roomId, payload);
        setLessons((prev) => [...prev, created]);
        message.success(`Đã tạo bài học "${created.name}" thành công!`);
      }

      setIsModalOpen(false);
      form.resetFields();
      setImageUrl("");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) {
        return;
      }
      message.error("Có lỗi xảy ra khi lưu bài học.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    try {
      await deleteLesson(lesson.id);
      setLessons((prev) => prev.filter((l) => l.id !== lesson.id));
      message.success(`Đã xóa bài học "${lesson.name}".`);
    } catch {
      message.error("Xóa bài học thất bại.");
    }
  };

  const columns: ColumnsType<Lesson> = [
    {
      title: "Ảnh bài học",
      dataIndex: "imageUrl",
      key: "imageUrl",
      width: 95,
      align: "center",
      render: (img: string | null, record: Lesson) =>
        img ? (
          <img
            src={img}
            alt={record.name}
            style={{
              width: 50,
              height: 50,
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
      title: "Tên bài học",
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
      title: "Thao tác",
      key: "actions",
      width: 220,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleOpenViewModal(record)}
            loading={isLoadingView && viewingLesson?.id === record.id}
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
            title="Xác nhận xóa bài học"
            description={`Bạn có chắc muốn xóa bài học "${record.name}"?`}
            onConfirm={() => handleDeleteLesson(record)}
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
      <div className="admin-table-container__header">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Select
            value={roomId}
            onChange={(val) => setRoomId(val)}
            style={{ width: 200 }}
            loading={isLoadingRooms}
            placeholder="Chọn cấp độ phòng học..."
            options={rooms.map((r) => ({
              value: r.id,
              label: r.name,
            }))}
          />
        </div>

        <div className="admin-table-container__actions">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreateModal}
            disabled={!roomId}
            size="middle"
          >
            Thêm
          </Button>
        </div>
      </div>

      <Table<Lesson>
        columns={columns}
        dataSource={lessons}
        rowKey="id"
        loading={isLoadingLessons}
        pagination={{
          pageSize: 12,
          showSizeChanger: true,
          showTotal: (total) => `Tổng cộng ${total} bài học`,
        }}
        scroll={{ x: 750, y: "calc(100vh - 290px)" }}
        style={{ width: "100%" }}
      />

      <Modal
        title={editingLesson ? "Sửa bài học" : "Thêm bài học"}
        open={isModalOpen}
        onOk={handleModalSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={isSubmitting}
        okText="Lưu"
        cancelText="Hủy"
        width={780}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12 }}>
            <Form.Item
              name="name"
              label="Tên bài học"
              rules={[{ required: true, message: "Vui lòng nhập tên bài học" }]}
            >
              <Input placeholder="Ví dụ: Bài 1 - Chuyển động cơ học" />
            </Form.Item>

            <Form.Item
              name="order"
              label="Thứ tự bài học"
              rules={[{ required: true, message: "Vui lòng nhập thứ tự" }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </div>

          {/* VÙNG THÊM ẢNH BÀI HỌC LƯU BASE64 */}
          <Form.Item label="Hình ảnh bài học (Lưu Base64)">
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
                    alt="Xem trước ảnh bài học"
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
                    padding: "16px 12px",
                    textAlign: "center",
                    color: "#94a3b8",
                    background: "#f8fafc",
                  }}
                >
                  <PictureOutlined style={{ fontSize: 24, marginBottom: 4, display: "block" }} />
                  <span>Chưa có ảnh bài học. Bấm nút phía trên để tải ảnh lên (lưu Base64)</span>
                </div>
              )}
            </Space>
          </Form.Item>

          <Form.Item
            name="html"
            label="Mã nguồn HTML nội dung bài học"
            rules={[{ required: true, message: "Vui lòng nhập nội dung HTML của bài học" }]}
          >
            <Input.TextArea
              rows={12}
              style={{ fontFamily: "monospace", fontSize: 13 }}
              placeholder="<!doctype html>..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL CHỈ XEM NỘI DUNG BÀI HỌC (READ-ONLY) */}
      <Modal
        title="Chi tiết bài học"
        open={Boolean(viewingLesson)}
        onCancel={() => setViewingLesson(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setViewingLesson(null)}>
            Đóng
          </Button>,
        ]}
        width={750}
      >
        {viewingLesson && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
              {viewingLesson.imageUrl && (
                <div style={{ width: 140, height: 95, borderRadius: 6, overflow: "hidden", border: "1px solid #e2e8f0", flexShrink: 0 }}>
                  <img src={viewingLesson.imageUrl} alt={viewingLesson.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{viewingLesson.name}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Thứ tự hiển thị: <strong>{viewingLesson.order}</strong></div>
                {viewingLesson.slug && (
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Đường dẫn: /{viewingLesson.slug}</div>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Nội dung HTML bài học:
              </div>
              <div
                style={{
                  maxHeight: 320,
                  overflowY: "auto",
                  padding: 12,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  fontFamily: "monospace",
                  fontSize: 12.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: "#334155",
                }}
              >
                {viewingLesson.html || "(Bài học chưa có mã HTML)"}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
