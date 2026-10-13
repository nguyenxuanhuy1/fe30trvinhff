"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  Switch,
  Popconfirm,
  message,
} from "antd";
import {
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  getAdminSocialPage,
  updateSocialPage,
  type AdminSocialPageContent,
  type SocialChannel,
  type SocialPlatform,
} from "@/modules/social";
import { adminPage } from "../admin.const";

const platformOptions: Array<{ value: SocialPlatform; label: string }> = [
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "zalo", label: "Zalo OA" },
  { value: "telegram", label: "Telegram" },
  { value: "discord", label: "Discord" },
];

function isValidChannelUrl(url: string): boolean {
  if (!url) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidColor(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

function createChannelId(platform: SocialPlatform): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${platform}-${suffix}`;
}

export function AdminSocialPanel() {
  const [content, setContent] = useState<AdminSocialPageContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const panelText = adminPage.socialPanel;

  const loadContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminSocialPage();
      setContent(data);
    } catch {
      message.error(panelText.loadFailed);
    } finally {
      setIsLoading(false);
    }
  }, [panelText]);

  useEffect(() => {
    let active = true;

    async function loadInitialContent() {
      setIsLoading(true);
      try {
        const data = await getAdminSocialPage();
        if (active) {
          setContent(data);
        }
      } catch {
        if (active) {
          message.error(panelText.loadFailed);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialContent();
    return () => {
      active = false;
    };
  }, [panelText]);

  function updateProfile<Key extends keyof AdminSocialPageContent["profile"]>(
    key: Key,
    value: string,
  ) {
    setContent((previous) => {
      if (!previous) {
        return previous;
      }
      return { ...previous, profile: { ...previous.profile, [key]: value } };
    });
  }

  function updateStat(index: number, key: "label" | "value", value: string) {
    setContent((previous) => {
      if (!previous) {
        return previous;
      }
      const stats = previous.stats.map((stat, statIndex) =>
        statIndex === index ? { ...stat, [key]: value } : stat,
      );
      return { ...previous, stats };
    });
  }

  function updateChannel(id: string, patch: Partial<SocialChannel>) {
    setContent((previous) => {
      if (!previous) {
        return previous;
      }
      return {
        ...previous,
        channels: previous.channels.map((channel) =>
          channel.id === id ? { ...channel, ...patch } : channel,
        ),
      };
    });
  }

  function handleAddChannel() {
    setContent((previous) => {
      if (!previous) {
        return previous;
      }
      const platform: SocialPlatform = "facebook";
      return {
        ...previous,
        channels: [
          ...previous.channels,
          {
            id: createChannelId(platform),
            platform,
            name: "Facebook",
            url: "",
            description: "",
            followers: "Đang cập nhật",
            actionLabel: "Theo dõi",
            color: "#1877f2",
            featured: previous.channels.length === 0,
            enabled: false,
          },
        ],
      };
    });
  }

  function handleRemoveChannel(id: string) {
    setContent((previous) => {
      if (!previous) {
        return previous;
      }
      return { ...previous, channels: previous.channels.filter((channel) => channel.id !== id) };
    });
  }

  function handleToggleFeatured(id: string, checked: boolean) {
    setContent((previous) => {
      if (!previous) {
        return previous;
      }
      return {
        ...previous,
        channels: previous.channels.map((channel) => ({
          ...channel,
          featured: channel.id === id ? checked : checked ? false : channel.featured,
        })),
      };
    });
  }

  async function handleSave() {
    if (!content) {
      return;
    }

    if (!content.profile.name.trim() || !content.profile.tagline.trim() || !content.profile.about.trim()) {
      message.error("Vui lòng nhập đầy đủ tên, mô tả ngắn và giới thiệu.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content.profile.contactEmail.trim())) {
      message.error("Email liên hệ không hợp lệ.");
      return;
    }
    if (
      !content.profile.logoSrc.trim() ||
      (!content.profile.logoSrc.startsWith("/") &&
        !content.profile.logoSrc.startsWith("http://") &&
        !content.profile.logoSrc.startsWith("https://") &&
        !content.profile.logoSrc.startsWith("data:image/"))
    ) {
      message.error("Logo phải là đường dẫn /images/..., link http(s) hoặc ảnh data:image/.");
      return;
    }
    if (
      content.stats.some((stat) => !stat.label.trim() || !stat.value.trim()) ||
      content.channels.some((channel) => !channel.name.trim())
    ) {
      message.error("Vui lòng nhập đầy đủ tên kênh và nội dung các mục số liệu.");
      return;
    }

    const invalidChannel = content.channels.find(
      (channel) =>
        (channel.enabled && !isValidChannelUrl(channel.url)) ||
        (channel.url.trim() && !isValidChannelUrl(channel.url)) ||
        !isValidColor(channel.color),
    );
    if (invalidChannel) {
      message.error(`Kênh "${invalidChannel.name || invalidChannel.id}" cần link http(s) hợp lệ và màu #rrggbb.`);
      return;
    }
    if (!content.channels.some((channel) => channel.enabled && isValidChannelUrl(channel.url))) {
      message.error("Cần bật ít nhất một kênh có link hợp lệ để trang Fanpage hiển thị.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateSocialPage({
        profile: content.profile,
        stats: content.stats,
        channels: content.channels,
      });
      setContent(updated);
      message.success(panelText.saveSuccess);
    } catch {
      message.error(panelText.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || !content) {
    return <Card loading>Đang tải cấu hình Fanpage…</Card>;
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card
        title={panelText.title}
        extra={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => void loadContent()}>
              {panelText.reset}
            </Button>
            <Button icon={<EyeOutlined />} href="/fanpage" target="_blank" rel="noopener noreferrer">
              {panelText.openPage}
            </Button>
            <Button type="primary" icon={<SaveOutlined />} loading={isSaving} onClick={() => void handleSave()}>
              {panelText.save}
            </Button>
          </Space>
        }
      >
        <p style={{ marginTop: 0 }}>{panelText.description}</p>
        <p style={{ marginBottom: 0, color: "#64748b" }}>{panelText.updatedAt(content.updatedAt)}</p>
      </Card>

      <Card title={panelText.profileTitle}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <label htmlFor="social-profile-name">Tên thương hiệu</label>
            <Input
              id="social-profile-name"
              value={content.profile.name}
              onChange={(event) => updateProfile("name", event.target.value)}
              maxLength={120}
            />
          </Col>
          <Col xs={24} md={12}>
            <label htmlFor="social-profile-email">Email hợp tác</label>
            <Input
              id="social-profile-email"
              value={content.profile.contactEmail}
              onChange={(event) => updateProfile("contactEmail", event.target.value)}
              maxLength={254}
            />
          </Col>
          <Col span={24}>
            <label htmlFor="social-profile-tagline">Mô tả ngắn dưới tên thương hiệu</label>
            <Input
              id="social-profile-tagline"
              value={content.profile.tagline}
              onChange={(event) => updateProfile("tagline", event.target.value)}
              maxLength={180}
              showCount
            />
          </Col>
          <Col xs={24} md={12}>
            <label htmlFor="social-profile-logo">Logo / avatar</label>
            <Input
              id="social-profile-logo"
              value={content.profile.logoSrc}
              onChange={(event) => updateProfile("logoSrc", event.target.value)}
              placeholder="/images/logo.png hoặc https://..."
              maxLength={2000}
            />
          </Col>
          <Col xs={24} md={12}>
            <label htmlFor="social-profile-logo-alt">Chữ thay thế cho logo</label>
            <Input
              id="social-profile-logo-alt"
              value={content.profile.logoAlt}
              onChange={(event) => updateProfile("logoAlt", event.target.value)}
              maxLength={120}
            />
          </Col>
          <Col span={24}>
            <label htmlFor="social-profile-about">Khối giới thiệu “Về chúng tôi”</label>
            <Input.TextArea
              id="social-profile-about"
              value={content.profile.about}
              onChange={(event) => updateProfile("about", event.target.value)}
              rows={4}
              maxLength={1000}
              showCount
            />
          </Col>
        </Row>
      </Card>

      <Card title={panelText.statsTitle}>
        <Row gutter={[16, 16]}>
          {content.stats.map((stat, index) => (
            <Col xs={24} md={8} key={stat.id}>
              <Card size="small" title={`Mục ${index + 1}`}>
                <label htmlFor={`social-stat-label-${stat.id}`}>Nhãn</label>
                <Input
                  id={`social-stat-label-${stat.id}`}
                  value={stat.label}
                  onChange={(event) => updateStat(index, "label", event.target.value)}
                  maxLength={80}
                />
                <div style={{ marginTop: 12 }}>
                  <label htmlFor={`social-stat-value-${stat.id}`}>Giá trị</label>
                  <Input
                    id={`social-stat-value-${stat.id}`}
                    value={stat.value}
                    onChange={(event) => updateStat(index, "value", event.target.value)}
                    maxLength={80}
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        title={panelText.channelsTitle}
        extra={
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddChannel}>
            {panelText.addChannel}
          </Button>
        }
      >
        {content.channels.length === 0 ? (
          <p style={{ marginBottom: 0 }}>{panelText.empty}</p>
        ) : (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {content.channels.map((channel) => (
              <Card
                key={channel.id}
                size="small"
                title={channel.name || channel.platform}
                extra={
                  <Space wrap>
                    <span>
                      {panelText.markFeatured}:{" "}
                      <Switch
                        checked={Boolean(channel.featured)}
                        onChange={(checked) => handleToggleFeatured(channel.id, checked)}
                      />
                    </span>
                    <span>
                      Hiển thị:{" "}
                      <Switch
                        checked={Boolean(channel.enabled)}
                        onChange={(checked) => updateChannel(channel.id, { enabled: checked })}
                      />
                    </span>
                    <Popconfirm
                      title={panelText.confirmRemoveChannel}
                      onConfirm={() => handleRemoveChannel(channel.id)}
                      okText="Xoá"
                      cancelText="Huỷ"
                    >
                      <Button danger icon={<DeleteOutlined />}>
                        {panelText.removeChannel}
                      </Button>
                    </Popconfirm>
                  </Space>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <label htmlFor={`social-channel-platform-${channel.id}`}>Nền tảng</label>
                    <Select
                      id={`social-channel-platform-${channel.id}`}
                      value={channel.platform}
                      options={platformOptions}
                      onChange={(platform: SocialPlatform) => updateChannel(channel.id, { platform })}
                      style={{ width: "100%" }}
                    />
                  </Col>
                  <Col xs={24} md={8}>
                    <label htmlFor={`social-channel-name-${channel.id}`}>Tên kênh</label>
                    <Input
                      id={`social-channel-name-${channel.id}`}
                      value={channel.name}
                      onChange={(event) => updateChannel(channel.id, { name: event.target.value })}
                      maxLength={80}
                    />
                  </Col>
                  <Col xs={24} md={8}>
                    <label htmlFor={`social-channel-followers-${channel.id}`}>Số người theo dõi</label>
                    <Input
                      id={`social-channel-followers-${channel.id}`}
                      value={channel.followers}
                      onChange={(event) => updateChannel(channel.id, { followers: event.target.value })}
                      maxLength={80}
                    />
                  </Col>
                  <Col xs={24} md={16}>
                    <label htmlFor={`social-channel-url-${channel.id}`}>Link kênh</label>
                    <Input
                      id={`social-channel-url-${channel.id}`}
                      value={channel.url}
                      onChange={(event) => updateChannel(channel.id, { url: event.target.value })}
                      placeholder="https://..."
                      maxLength={500}
                    />
                  </Col>
                  <Col xs={24} md={8}>
                    <label htmlFor={`social-channel-action-${channel.id}`}>Nhãn nút</label>
                    <Input
                      id={`social-channel-action-${channel.id}`}
                      value={channel.actionLabel}
                      onChange={(event) => updateChannel(channel.id, { actionLabel: event.target.value })}
                      maxLength={40}
                    />
                  </Col>
                  <Col xs={24} md={16}>
                    <label htmlFor={`social-channel-description-${channel.id}`}>Mô tả một dòng</label>
                    <Input.TextArea
                      id={`social-channel-description-${channel.id}`}
                      value={channel.description}
                      onChange={(event) => updateChannel(channel.id, { description: event.target.value })}
                      rows={2}
                      maxLength={240}
                      showCount
                    />
                  </Col>
                  <Col xs={24} md={8}>
                    <label htmlFor={`social-channel-color-${channel.id}`}>Màu thương hiệu</label>
                    <Space style={{ width: "100%" }}>
                      <input
                        id={`social-channel-color-${channel.id}`}
                        type="color"
                        value={isValidColor(channel.color) ? channel.color : "#1877f2"}
                        onChange={(event) => updateChannel(channel.id, { color: event.target.value })}
                        aria-label={`Màu ${channel.name || channel.platform}`}
                      />
                      <Input
                        value={channel.color}
                        onChange={(event) => updateChannel(channel.id, { color: event.target.value })}
                        maxLength={7}
                      />
                    </Space>
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        )}
      </Card>
    </Space>
  );
}
