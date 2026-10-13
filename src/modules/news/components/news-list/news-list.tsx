import type { CommunityThread, NewsItem } from "@/modules/news/types";
import "./news-list.scss";

interface NewsListProps {
  articles: NewsItem[];
  emptyMessage: string;
}

function isCommunityThread(article: NewsItem): article is CommunityThread {
  return "replyCount" in article && typeof article.replyCount === "number";
}

function NewsList({ articles, emptyMessage }: NewsListProps) {
  if (articles.length === 0) {
    return <p className="news-list__empty">{emptyMessage}</p>;
  }

  return (
    <ul className="news-list">
      {articles.map((article) => {
        const isCommunity = isCommunityThread(article);

        return (
          <li className="news-list__item" key={article.slug}>
            <article className="news-list__card">
              <header className="news-list__meta">
                <span
                  className={`news-list__category${
                    article.category === "CỘNG ĐỒNG" ? " news-list__category--community" : ""
                  }`}
                >
                  {article.category}
                </span>
                <time className="news-list__date" dateTime={article.publishedAt}>
                  {new Date(article.publishedAt).toLocaleDateString("vi-VN")}
                </time>
              </header>

              <h2 className="news-list__title">{article.title}</h2>

              <p className="news-list__excerpt">{article.excerpt}</p>

              <footer className="news-list__footer">
                <span className="news-list__author">{article.author}</span>
                {isCommunity && (
                  <span className="news-list__stats">
                    <span className="news-list__stat">💬 {article.replyCount} thảo luận</span>
                    <span className="news-list__stat">👥 {article.participantCount} tham gia</span>
                  </span>
                )}
              </footer>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

export { NewsList };
export type { NewsListProps };
