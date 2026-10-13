import { BRAND_NAME } from "@/modules/landing/constants";

/*
 * ADMIN EDIT HERE
 * Mọi nội dung của trang /fanpage nằm trong file này.
 * - Sửa text, số liệu, email và link trực tiếp trong các object bên dưới.
 * - enabled: true nghĩa là kênh hiển thị; enabled: false nghĩa là giữ mẫu nhưng ẩn khỏi trang.
 * - Chỉ những kênh có link bắt đầu bằng http:// hoặc https:// mới được hiển thị.
 * - Đặt featured: true cho đúng 1 kênh để hiển thị card nổi bật ở đầu trang.
 */

type SocialPlatform =
  | "facebook"
  | "tiktok"
  | "youtube"
  | "instagram"
  | "zalo"
  | "telegram"
  | "discord";

interface SocialStat {
  id: string;
  label: string;
  value: string;
}

interface SocialChannel {
  id: string;
  platform: SocialPlatform;
  name: string;
  url: string;
  description: string;
  followers: string;
  actionLabel: string;
  color: string;
  featured?: boolean;
  enabled?: boolean;
}

interface SocialProfile {
  name: string;
  tagline: string;
  logoSrc: string;
  logoAlt: string;
  about: string;
  contactEmail: string;
}

const socialProfile: SocialProfile = {
  name: `${BRAND_NAME} Game Center`,
  tagline:
    "Theo dõi kênh chính thức để nhận tin tức, sự kiện, hướng dẫn chơi và quà tặng mới nhất.",
  logoSrc: "/images/logo.png",
  logoAlt: `${BRAND_NAME} Game Center`,
  about:
    "STEM Game Center là sân chơi học qua trò chơi dành cho học sinh cấp 2. Các kênh bên dưới là nơi cập nhật lịch sự kiện, mẹo vượt màn chơi và quà tặng cộng đồng.",
  contactEmail: "hotro@steamgame.vn",
};

const socialStats: readonly SocialStat[] = [
  { id: "followers", label: "Tổng lượt theo dõi", value: "Đang cập nhật" },
  { id: "channels", label: "Kênh chính thức", value: "01" },
  { id: "founded", label: "Năm thành lập", value: "2026" },
];

const socialChannels: readonly SocialChannel[] = [
  {
    id: "facebook",
    platform: "facebook",
    name: "Facebook",
    url: "https://www.facebook.com/profile.php?id=61595040895107",
    description: "Fanpage Hỗ trợ chính thức: tin tức, sự kiện và giải đáp cho người chơi.",
    followers: "Đang cập nhật",
    actionLabel: "Theo dõi",
    color: "#1877f2",
    featured: true,
    enabled: true,
  },
  {
    id: "tiktok",
    platform: "tiktok",
    name: "TikTok",
    url: "#",
    description: "Video ngắn: mẹo chơi, khoảnh khắc cộng đồng và hậu trường sự kiện.",
    followers: "Đang cập nhật",
    actionLabel: "Xem",
    color: "#111111",
    enabled: false,
  },
  {
    id: "youtube",
    platform: "youtube",
    name: "YouTube",
    url: "#",
    description: "Video hướng dẫn vượt màn chơi và tổng hợp sự kiện nổi bật.",
    followers: "Đang cập nhật",
    actionLabel: "Xem",
    color: "#ff0000",
    enabled: false,
  },
  {
    id: "instagram",
    platform: "instagram",
    name: "Instagram",
    url: "#",
    description: "Hình ảnh sự kiện, vật phẩm mới và hoạt động cộng đồng.",
    followers: "Đang cập nhật",
    actionLabel: "Xem",
    color: "#e1306c",
    enabled: false,
  },
  {
    id: "zalo",
    platform: "zalo",
    name: "Zalo OA",
    url: "#",
    description: "Kênh thông báo nhanh: lịch bảo trì, sự kiện và quà tặng.",
    followers: "Đang cập nhật",
    actionLabel: "Quan tâm",
    color: "#0068ff",
    enabled: false,
  },
  {
    id: "telegram",
    platform: "telegram",
    name: "Telegram",
    url: "#",
    description: "Nhóm cập nhật nhanh và trao đổi trực tiếp cùng cộng đồng.",
    followers: "Đang cập nhật",
    actionLabel: "Tham gia",
    color: "#229ed9",
    enabled: false,
  },
  {
    id: "discord",
    platform: "discord",
    name: "Discord",
    url: "#",
    description: "Máy chủ cộng đồng: tìm đồng đội, thảo luận và nhận quà sự kiện.",
    followers: "Đang cập nhật",
    actionLabel: "Tham gia",
    color: "#5865f2",
    enabled: false,
  },
];

function isPublishedSocialChannel(channel: SocialChannel): boolean {
  if (channel.enabled === false) {
    return false;
  }

  return channel.url.startsWith("http://") || channel.url.startsWith("https://");
}

function getPublishedSocialChannels(): SocialChannel[] {
  return selectPublishedSocialChannels(socialChannels);
}

function getFeaturedSocialChannel(): SocialChannel | undefined {
  return selectFeaturedSocialChannel(socialChannels);
}

function getOtherSocialChannels(): SocialChannel[] {
  return selectOtherSocialChannels(socialChannels);
}

function selectPublishedSocialChannels(channels: readonly SocialChannel[]): SocialChannel[] {
  return channels.filter(isPublishedSocialChannel);
}

function selectFeaturedSocialChannel(
  channels: readonly SocialChannel[],
): SocialChannel | undefined {
  const published = selectPublishedSocialChannels(channels);

  return published.find((channel) => channel.featured === true) ?? published[0];
}

function selectOtherSocialChannels(channels: readonly SocialChannel[]): SocialChannel[] {
  const published = selectPublishedSocialChannels(channels);
  const featured = selectFeaturedSocialChannel(channels);

  if (!featured) {
    return published;
  }

  return published.filter((channel) => channel.id !== featured.id);
}

export {
  getFeaturedSocialChannel,
  getOtherSocialChannels,
  getPublishedSocialChannels,
  selectFeaturedSocialChannel,
  selectOtherSocialChannels,
  socialProfile,
  socialStats,
};
export type { SocialChannel, SocialPlatform, SocialProfile, SocialStat };
