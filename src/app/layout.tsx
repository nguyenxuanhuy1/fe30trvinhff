import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { siteConfig } from "@/config";
import {
  buildOrganization,
  buildWebSite,
  DEFAULT_OG_IMAGE,
  SITE_LOCALE,
  SITE_URL,
} from "@/lib/seo";
import { Providers } from "@/app/providers";
import { baloo2, lora, zahra } from "@/styles/fonts";
import "@/styles/globals.scss";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1c1815",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: siteConfig.seoText.home.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.seoText.home.description,
  keywords: siteConfig.seoText.home.keywords ? [...siteConfig.seoText.home.keywords] : undefined,
  applicationName: siteConfig.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteConfig.name,
  },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: `${SITE_URL}${siteConfig.routes.home}`,
    siteName: siteConfig.name,
    locale: SITE_LOCALE,
    title: siteConfig.seoText.home.title,
    description: siteConfig.seoText.home.description,
    images: [
      {
        url: DEFAULT_OG_IMAGE.path,
        width: DEFAULT_OG_IMAGE.width,
        height: DEFAULT_OG_IMAGE.height,
        alt: DEFAULT_OG_IMAGE.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.seoText.home.title,
    description: siteConfig.seoText.home.description,
    images: [DEFAULT_OG_IMAGE.path],
  },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png" }],
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={siteConfig.language} className={`${zahra.variable} ${lora.variable} ${baloo2.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganization()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebSite()) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

export default RootLayout;
export type { RootLayoutProps };
