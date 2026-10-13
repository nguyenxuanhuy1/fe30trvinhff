import type { Metadata } from "next";
import { siteConfig } from "@/config";
import { buildMetadata } from "@/lib/seo";
import { AboutSections, HeroHeader, LandingFooter } from "@/modules/landing";
import { ExitFullscreenButton } from "@/components/ExitFullscreenButton";
import { PageWrapper } from "./_components/page-wrapper";

function generateMetadata(): Metadata {
  return buildMetadata(siteConfig.routes.home, siteConfig.seoText.home);
}

function HomePage() {
  return (
    <PageWrapper>
      <main>
        <HeroHeader />
        <AboutSections />
      </main>
      <LandingFooter />
      <ExitFullscreenButton />
    </PageWrapper>
  );
}

export default HomePage;
export { generateMetadata };
