import { HeroHeader, LandingFooter } from "@/modules/landing";
import { NewsPage } from "@/modules/news";
import { PageWrapper } from "../_components/page-wrapper";

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
