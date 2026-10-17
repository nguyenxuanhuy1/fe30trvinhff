"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
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
  UploadOutlined,
} from "@ant-design/icons";
import {
  createArticle,
  deleteArticle,
  getArticles,
  updateArticle,
  type CreateArticlePayload,
  type NewsArticle,
  type NewsCategory,
} from "@/modules/news";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AdminArticlesPanel() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal thêm / sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");
  const [form] = Form.useForm();

  // Modal chỉ xem chi tiết bài viết
  const [viewingArticle, setViewingArticle] = useState<NewsArticle | null>(null);

  // Load articles
  async function loadArticles() {
    try {
      setIsLoading(true);
      const data = await getArticles({ limit: 100 });
      setArticles(data.articles);
    } catch {
      message.error("Không thể tải danh sách bài viết.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadArticles();
  }, []);

  // Lọc bài viết
  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchCat = categoryFilter === "all" || a.category === categoryFilter;
      const matchSearch =
        !searchFilter.trim() ||
        a.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        a.author.toLowerCase().includes(searchFilter.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [articles, categoryFilter, searchFilter]);

  // Xử lý tải ảnh từ máy tính (lưu Base64)
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
      setCoverImageUrl(base64String);
      form.setFieldValue("coverImage", base64String);
      message.success("Đã chọn ảnh bìa thành công (lưu Base64)!");
    };
    reader.onerror = () => {
      message.error("Không thể đọc file ảnh.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleClearImage = () => {
    setCoverImageUrl("");
    form.setFieldValue("coverImage", "");
  };

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    setEditingArticle(null);
    form.resetFields();
    setCoverImageUrl("");
    form.setFieldsValue({
      category: "TIN TỨC",
      author: "Ban Biên Tập",
      authorRole: "Chuyên gia Khảo cứu",
      readTime: "5 phút đọc",
      coverImage: "",
      featured: false,
      hot: false,
      tier: 3,
      tagsString: "STEAM, Khảo cứu",
    });
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (article: NewsArticle) => {
    setEditingArticle(article);
    form.resetFields();
    setCoverImageUrl(article.coverImage || "");
    form.setFieldsValue({
      title: article.title,
      slug: article.slug,
      category: article.category,
      author: article.author,
      authorRole: article.authorRole,
      readTime: article.readTime,
      coverImage: article.coverImage || "",
      excerpt: article.excerpt,
      content: article.content,
      featured: article.featured,
      hot: article.hot,
      tier: article.tier ?? 3,
      tagsString: article.tags?.join(", ") || "",
    });
    setIsModalOpen(true);
  };

  // Submit Modal
  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      const parsedTags = values.tagsString
        ? values.tagsString
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [];

      const rawCover = coverImageUrl?.trim() || values.coverImage?.trim() || undefined;
      const finalCover = rawCover && rawCover.length > 0 ? rawCover : undefined;

      const payload: CreateArticlePayload = {
        title: (values.title || "").trim(),
        slug: (values.slug || "").trim() || undefined,
        category: values.category as NewsCategory,
        author: (values.author || "").trim() || "Ban Biên Tập",
        authorRole: values.authorRole ? String(values.authorRole).trim() : undefined,
        readTime: values.readTime ? String(values.readTime).trim() : "5 phút đọc",
        coverImage: finalCover,
        excerpt: (values.excerpt || "").trim(),
        content: (values.content || "").trim(),
        featured: Boolean(values.featured),
        hot: Boolean(values.hot),
        tier: Number(values.tier) || 3,
        tags: parsedTags,
      };

      if (editingArticle && editingArticle.id) {
        const updated = await updateArticle(editingArticle.id, payload);
        message.success(`Đã cập nhật bài viết "${updated.title}" thành công!`);
      } else {
        const created = await createArticle(payload);
        message.success(`Đã xuất bản bài viết "${created.title}" thành công!`);
      }

      await loadArticles();
      setIsModalOpen(false);
      form.resetFields();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) {
        return;
      }
      console.error("Lỗi khi lưu bài viết:", err);
      let msg = "Thao tác thất bại";
      if (err && typeof err === "object") {
        if ("response" in err) {
          const res = (err as { response?: { data?: { message?: string } } }).response;
          if (res?.data?.message) {
            msg = res.data.message;
          }
        } else if ("message" in err && typeof (err as { message?: unknown }).message === "string") {
          msg = (err as { message: string }).message;
        }
      }
      message.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xóa bài viết
  const handleDeleteArticle = async (article: NewsArticle) => {
    if (!article.id) return;
    try {
      await deleteArticle(article.id);
      setArticles((prev) => prev.filter((a) => a.id !== article.id));
      message.success(`Đã xóa bài viết "${article.title}".`);
    } catch {
      message.error("Xóa bài viết thất bại.");
    }
  };

  // Columns Antd Table
  const columns: ColumnsType<NewsArticle> = [
    {
      title: "Ảnh bìa",
      dataIndex: "coverImage",
      key: "coverImage",
      width: 75,
      render: (img: string, record) => (
        <div style={{ width: 50, height: 38, position: "relative", borderRadius: 4, overflow: "hidden", border: "1px solid #e2e8f0" }}>
          {img ? (
            <img src={img} alt={record.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", fontSize: 10, color: "#94a3b8" }}>
              Chưa có ảnh
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Tiêu đề & Đường dẫn",
      dataIndex: "title",
      key: "title",
      render: (title: string, record) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>/{record.slug}</div>
        </div>
      ),
    },
    {
      title: "Chuyên mục",
      dataIndex: "category",
      key: "category",
      width: 130,
      render: (cat: string) => <Tag>{cat}</Tag>,
    },
    {
      title: "Tác giả",
      dataIndex: "author",
      key: "author",
      width: 140,
      render: (author: string, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{author}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{record.readTime}</div>
        </div>
      ),
    },
    {
      title: "Cấp hiển thị",
      dataIndex: "tier",
      key: "tier",
      width: 130,
      render: (tier: number = 3) => {
        if (tier === 1) return <Tag>Cấp 1</Tag>;
        if (tier === 2) return <Tag>Cấp 2</Tag>;
        return <Tag>Cấp 3</Tag>;
      },
    },
    {
      title: "Nhãn",
      key: "badges",
      width: 130,
      render: (_, record) => (
        <Space size={4} wrap>
          {record.featured && <Tag>Nổi bật</Tag>}
          {record.hot && <Tag>Hot</Tag>}
          {!record.featured && !record.hot && <span style={{ color: "#94a3b8" }}>—</span>}
        </Space>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
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
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setViewingArticle(record)}
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
            title="Xác nhận xóa bài viết"
            description={`Bạn có chắc muốn xóa bài viết "${record.title}"?`}
            onConfirm={() => handleDeleteArticle(record)}
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
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 140 }}
            options={[
              { value: "all", label: "Tất cả mục" },
              { value: "TIN TỨC", label: "Tin tức" },
              { value: "KHÁM PHÁ", label: "Khám phá" },
              { value: "SỰ KIỆN", label: "Sự kiện" },
              { value: "HƯỚNG DẪN", label: "Hướng dẫn" },
            ]}
          />
          <Input
            placeholder="Tìm bài viết..."
            prefix={<SearchOutlined />}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
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

      <Table<NewsArticle>
        columns={columns}
        dataSource={filteredArticles}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 12,
          showSizeChanger: true,
          pageSizeOptions: ["10", "12", "20", "50"],
          showTotal: (total) => `Tổng cộng ${total} bài viết`,
        }}
        scroll={{ x: 950, y: "calc(100vh - 290px)" }}
        style={{ width: "100%" }}
      />

      {/* MODAL ANTD: THÊM MỚI / CHỈNH SỬA BÀI VIẾT */}
      <Modal
        title={editingArticle ? "Sửa bài viết" : "Thêm bài viết"}
        open={isModalOpen}
        onOk={handleModalSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={isSubmitting}
        okText="Lưu"
        cancelText="Hủy"
        width={920}
        style={{ top: 24 }}
        styles={{ body: { padding: "16px 24px 24px" } }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <Form.Item
              name="title"
              label="Tiêu đề"
              rules={[{ required: true, message: "Vui lòng nhập tiêu đề bài viết" }]}
            >
              <Input
                placeholder="Tiêu đề bài viết..."
                onChange={(e) => {
                  if (!editingArticle) {
                    form.setFieldValue("slug", slugify(e.target.value));
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              name="slug"
              label="Đường dẫn (Slug)"
              rules={[{ required: true, message: "Vui lòng nhập slug" }]}
            >
              <Input placeholder="duong-dan-bai-viet" />
            </Form.Item>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Form.Item
              name="category"
              label="Chuyên mục"
              rules={[{ required: true, message: "Vui lòng chọn chuyên mục" }]}
            >
              <Select
                options={[
                  { value: "TIN TỨC", label: "Tin tức" },
                  { value: "KHÁM PHÁ", label: "Khám phá" },
                  { value: "SỰ KIỆN", label: "Sự kiện" },
                  { value: "CỘNG ĐỒNG", label: "Cộng đồng" },
                  { value: "HƯỚNG DẪN", label: "Hướng dẫn" },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="readTime"
              label="Thời gian đọc"
              rules={[{ required: true, message: "Vui lòng nhập thời gian đọc" }]}
            >
              <Input placeholder="5 phút đọc" />
            </Form.Item>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Form.Item
              name="author"
              label="Tác giả"
              rules={[{ required: true, message: "Vui lòng nhập tác giả" }]}
            >
              <Input placeholder="Tác giả (VD: Ban Biên Tập)..." />
            </Form.Item>

            <Form.Item
              name="authorRole"
              label="Vai trò / Chức danh"
            >
              <Input placeholder="Chuyên gia Khảo cứu, Phóng viên..." />
            </Form.Item>
          </div>

          <Form.Item label="Ảnh bìa">
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
                  style={{ flex: 1 }}
                >
                  Tải ảnh lên
                </Button>
                {coverImageUrl && (
                  <Button danger icon={<DeleteOutlined />} onClick={handleClearImage}>
                    Gỡ ảnh
                  </Button>
                )}
              </div>

              {coverImageUrl ? (
                <div
                  style={{
                    position: "relative",
                    borderRadius: 6,
                    border: "1px dashed #cbd5e1",
                    padding: 12,
                    background: "#f8fafc",
                    textAlign: "center",
                  }}
                >
                  <img
                    src={coverImageUrl}
                    alt="Xem trước ảnh bìa"
                    style={{
                      maxHeight: 220,
                      maxWidth: "100%",
                      borderRadius: 4,
                      objectFit: "contain",
                    }}
                  />
                </div>
              ) : null}

              <Form.Item name="coverImage" noStyle>
                <Input
                  placeholder="Hoặc dán URL ảnh / chuỗi Data Base64..."
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item
            name="excerpt"
            label="Tóm tắt"
            rules={[{ required: true, message: "Vui lòng nhập tóm tắt bài viết" }]}
          >
            <Input.TextArea rows={2} placeholder="Tóm tắt ngắn gọn..." />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true, message: "Vui lòng nhập nội dung bài viết" }]}
          >
            <Input.TextArea rows={8} placeholder="Nội dung chi tiết của bài viết..." />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <Form.Item
              name="tier"
              label="Cấp hiển thị"
            >
              <Select
                options={[
                  { value: 1, label: "Cấp 1" },
                  { value: 2, label: "Cấp 2" },
                  { value: 3, label: "Cấp 3" },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="featured"
              label="Nổi bật"
              valuePropName="checked"
            >
              <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
            </Form.Item>

            <Form.Item
              name="hot"
              label="Hot"
              valuePropName="checked"
            >
              <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
            </Form.Item>
          </div>

          <Form.Item name="tagsString" label="Thẻ (Tags)">
            <Input placeholder="STEAM, Khảo cứu..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL CHỈ XEM NỘI DUNG BÀI VIẾT (READ-ONLY) */}
      <Modal
        title="Chi tiết bài viết"
        open={Boolean(viewingArticle)}
        onCancel={() => setViewingArticle(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setViewingArticle(null)}>
            Đóng
          </Button>,
        ]}
        width={750}
      >
        {viewingArticle && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
            {viewingArticle.coverImage && (
              <div style={{ width: "100%", height: 220, borderRadius: 6, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                <img src={viewingArticle.coverImage} alt={viewingArticle.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                <Tag>{viewingArticle.category}</Tag>
                {viewingArticle.featured && <Tag color="blue">Nổi bật</Tag>}
                {viewingArticle.hot && <Tag color="red">Hot</Tag>}
                <span style={{ fontSize: 12, color: "#64748b" }}>Tác giả: {viewingArticle.author}</span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>• {viewingArticle.readTime}</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{viewingArticle.title}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Đường dẫn: /{viewingArticle.slug}</div>
            </div>

            {viewingArticle.excerpt && (
              <div style={{ padding: "10px 14px", background: "#f8fafc", borderLeft: "3px solid #2563eb", borderRadius: "0 6px 6px 0", fontSize: 13.5, fontStyle: "italic", color: "#475569" }}>
                {viewingArticle.excerpt}
              </div>
            )}

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Nội dung bài viết:
              </div>
              <div
                style={{
                  maxHeight: 300,
                  overflowY: "auto",
                  padding: 12,
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: "#1e293b",
                  whiteSpace: "pre-wrap",
                }}
              >
                {viewingArticle.content}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
