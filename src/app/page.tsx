import type { Metadata } from "next";
import { siteConfig } from "@/config";
import { buildMetadata, buildWebApplication, buildWebSite } from "@/lib/seo";
import { AboutSections, HeroHeader, LandingFooter } from "@/modules/landing";
import { PageWrapper } from "./_components/page-wrapper";

function generateMetadata(): Metadata {
  return buildMetadata(siteConfig.routes.home, siteConfig.seoText.home);
}

function HomePage() {
  return (
    <PageWrapper>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebSite()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebApplication()) }}
      />
      <main>
        <HeroHeader />
        <AboutSections />
      </main>
      <LandingFooter />
    </PageWrapper>
  );
}

export default HomePage;
export { generateMetadata };
