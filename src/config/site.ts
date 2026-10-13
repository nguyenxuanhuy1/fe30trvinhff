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
    path: "/images/logo.png",
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
      title: env.appName,
      description: "Cổng trò chơi giáo dục STEAM kết hợp công nghệ theo dõi cử chỉ tay 3D, phòng thí nghiệm ảo và hệ thống nhiệm vụ đổi thưởng hấp dẫn.",
    },
  } satisfies SeoText,
} as const;

export { siteConfig };
export type { PageSeoText, SeoText, SocialLink };
