import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { HeroHeader, LandingFooter } from "@/modules/landing";
import { NewsPage, newsPage } from "@/modules/news";
import { PageWrapper } from "../_components/page-wrapper";

function generateMetadata(): Metadata {
  return buildMetadata(newsPage.routes.index, {
    title: `${newsPage.title} | Project30TR`,
    description: newsPage.descriptions.all,
  });
}

function NewsIndexPage() {
  return (
    <PageWrapper>
      <main>
        <HeroHeader variant="compact" showBackButton={false} />
        <NewsPage />
      </main>
      <LandingFooter />
    </PageWrapper>
  );
}

export default NewsIndexPage;
export { generateMetadata };
