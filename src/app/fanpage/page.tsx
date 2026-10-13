import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { HeroHeader, LandingFooter } from "@/modules/landing";
import { SocialIcon } from "@/modules/social/components/social-icons";
import {
  getPublicSocialPage,
  selectFeaturedSocialChannel,
  selectOtherSocialChannels,
  socialProfile,
  socialStats,
  type SocialChannel,
  type SocialProfile,
  type SocialStat,
} from "@/modules/social";
import { PageWrapper } from "../_components/page-wrapper";
import "./fanpage.scss";

export const dynamic = "force-dynamic";

interface SocialPageContent {
  profile: SocialProfile;
  stats: SocialStat[];
  channels: SocialChannel[];
}

const fallbackSocialContent: SocialPageContent = {
  profile: socialProfile,
  stats: [...socialStats],
  channels: [],
};

function isSocialContent(value: unknown): value is SocialPageContent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const content = value as Partial<SocialPageContent>;
  return Boolean(content.profile) && Array.isArray(content.stats) && Array.isArray(content.channels);
}

import { cache } from "react";

const getSocialPageContent = cache(async function getSocialPageContent(): Promise<SocialPageContent> {
  try {
    const content = await getPublicSocialPage();
    if (isSocialContent(content)) {
      return content;
    }
  } catch {
    // Backend/API chưa sẵn sàng thì dùng dữ liệu tĩnh dự phòng.
  }
  return fallbackSocialContent;
});

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSocialPageContent();
  const title = `${content.profile.name} | Fanpage và kênh chính thức`;
  const description = content.profile.tagline;

  return {
    title,
    description,
    alternates: { canonical: "/fanpage" },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      url: "/fanpage",
      siteName: content.profile.name,
      locale: "vi_VN",
      title,
      description,
      images: [
        {
          url: "/images/logo.png",
          width: 823,
          height: 303,
          alt: content.profile.logoAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/logo.png"],
    },
  };
}

function SocialChannelCard({
  channel,
  featured = false,
}: {
  channel: SocialChannel;
  featured?: boolean;
}) {
  return (
    <a
      className={`fanpage__channel${featured ? " fanpage__channel--featured" : ""}`}
      href={channel.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ "--c": channel.color } as CSSProperties}
      aria-label={`${channel.name}: ${channel.description}`}
    >
      <span className="fanpage__channel-icon" aria-hidden="true">
        <SocialIcon platform={channel.platform} />
      </span>
      <span className="fanpage__channel-body">
        <span className="fanpage__channel-name">{channel.name}</span>
        <span className="fanpage__channel-description">{channel.description}</span>
        <span className="fanpage__channel-followers">{channel.followers}</span>
      </span>
      <span className="fanpage__channel-action">{channel.actionLabel}</span>
    </a>
  );
}

async function Fanpage() {
  const content = await getSocialPageContent();
  const featuredChannel = selectFeaturedSocialChannel(content.channels);
  const otherChannels = selectOtherSocialChannels(content.channels);
  const year = new Date().getFullYear();

  return (
    <PageWrapper>
      <main>
        <HeroHeader variant="compact" showBackButton={false} />
        <div className="fanpage">
      <div className="fanpage__container">
        <header className="fanpage__hero">
          <h1 className="fanpage__name">{content.profile.name}</h1>
          <p className="fanpage__tagline">{content.profile.tagline}</p>
          <dl className="fanpage__stats">
            {content.stats.map((stat) => (
              <div className="fanpage__stat" key={stat.id}>
                <dt className="fanpage__stat-label">{stat.label}</dt>
                <dd className="fanpage__stat-value">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        {featuredChannel ? (
          <section className="fanpage__featured" aria-label="Kênh nổi bật">
            <SocialChannelCard channel={featuredChannel} featured />
          </section>
        ) : null}

        <section className="fanpage__channels" aria-label="Các kênh khác">
          <h2 className="fanpage__section-title">Các kênh khác</h2>
          {otherChannels.length > 0 ? (
            <div className="fanpage__grid">
              {otherChannels.map((channel) => (
                <SocialChannelCard channel={channel} key={channel.id} />
              ))}
            </div>
          ) : (
            <p className="fanpage__empty">
              Kênh Facebook bên trên đang hoạt động. Các kênh còn lại sẽ được admin cập nhật link trong phần dữ liệu của trang này.
            </p>
          )}
        </section>

        <section className="fanpage__about" aria-label="Về chúng tôi">
          <h2 className="fanpage__section-title">Về chúng tôi</h2>
          <p>{content.profile.about}</p>
          <p>
            Email hợp tác:{" "}
            <a href={`mailto:${content.profile.contactEmail}`}>{content.profile.contactEmail}</a>
          </p>
        </section>

        <footer className="fanpage__footer">
          <p>© {year} {content.profile.name}</p>
          <a href={`mailto:${content.profile.contactEmail}`}>{content.profile.contactEmail}</a>
        </footer>
      </div>
        </div>
      </main>
      <LandingFooter />
    </PageWrapper>
  );
}

export default Fanpage;
