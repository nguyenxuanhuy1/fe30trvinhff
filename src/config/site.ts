import { env } from "./env";

interface SocialLink {
  platform: string;
  url: string;
}

interface PageSeoText {
  title: string;
  description: string;
  keywords?: readonly string[];
  noIndex?: boolean;
  noFollow?: boolean;
}

interface SeoText {
  home: PageSeoText;
}

const siteConfig = {
  name: env.appName,
  language: "vi",
  locale: "vi_VN",
  ogImage: {
    path: "/images/background.webp",
    width: 1200,
    height: 630,
    alt: env.appName,
  },
  themeColor: "#e6e3d8",
  socialLinks: [] as readonly SocialLink[],
  routes: {
    home: "/",
  },
  seoText: {
    home: {
      title: `${env.appName} - Cổng Trò Chơi Giáo Dục STEAM & Thí Nghiệm 3D Tương Tác`,
      description: `Khám phá ${env.appName} - nền tảng giáo dục STEAM tương tác thế hệ mới kết hợp nhận diện cử chỉ tay 3D (Hand Tracking), phòng thí nghiệm ảo và đổi thưởng vật phẩm hấp dẫn.`,
      keywords: [
        env.appName,
        "STEAMaze",
        "STEAM",
        "giáo dục STEAM",
        "thí nghiệm ảo",
        "hand tracking",
        "học qua trò chơi",
        "khoa học công nghệ",
        "game giáo dục",
        "thực hành khoa học",
        "học sinh",
      ],
    },
  } satisfies SeoText,
} as const;

export { siteConfig };
export type { PageSeoText, SeoText, SocialLink };
