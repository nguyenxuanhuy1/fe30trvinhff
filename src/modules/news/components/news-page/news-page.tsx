"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { newsArticles } from "../../data/content";
import type { NewsArticle } from "../../types";
import { getArticles } from "../../services/news.service";
import { GameModal } from "@/components/ui/game-modal";
import "./news-page.scss";

interface NewsPageProps {
  articles?: NewsArticle[];
}

function formatArticleDateTime(dateString?: string): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${hours}:${minutes} · Ngày ${day} tháng ${month}, ${year}`;
}

function NewsPage({ articles = newsArticles }: NewsPageProps) {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [articleList, setArticleList] = useState<NewsArticle[]>(articles);

  // Tải danh sách bài viết thời gian thực từ Backend API
  useEffect(() => {
    async function loadLiveArticles() {
      try {
        const res = await getArticles({ limit: 100 });
        if (res && res.articles && res.articles.length > 0) {
          setArticleList(res.articles);
        }
      } catch {
        // Giữ dữ liệu mẫu nếu mất kết nối
      }
    }

    void loadLiveArticles();
  }, []);

  // Tự động phân cấp hiển thị & xếp bài theo quy tắc:
  // - Cấp 1: Bài lớn nhất ở vị trí chính
  // - Cấp 2: Bài bên cạnh (tối đa 5 bài). Khi có bài cấp 1 mới, bài cấp 1 cũ tự đẩy xuống cấp 2.
  // - Cấp 3: Bài dưới cùng. Khi bài cấp 2 quá 5 bài, các bài dư tự động đẩy xuống cấp 3.
  const { leadArticle, sidebarArticles, bottomArticles } = useMemo(() => {
    if (!articleList || articleList.length === 0) {
      return { leadArticle: null, sidebarArticles: [], bottomArticles: [] };
    }

    // Tách theo cấp được gán
    const rawTier1 = articleList.filter((a) => a.tier === 1 || (a.tier === undefined && a.featured));
    const rawTier2 = articleList.filter((a) => a.tier === 2);
    const rawTier3 = articleList.filter((a) => a.tier === 3 || (a.tier === undefined && !a.featured));

    // 1. Cấp 1: 1 bài mới nhất làm Cấp 1
    let t1: NewsArticle | null = null;
    const pushedToTier2: NewsArticle[] = [];

    if (rawTier1.length > 0) {
      t1 = rawTier1[0];
      // Nếu có nhiều bài cấp 1, các bài còn lại bị đẩy xuống cấp 2
      pushedToTier2.push(...rawTier1.slice(1));
    } else {
      t1 = articleList[0];
    }

    // 2. Cấp 2: Các bài được gán cấp 2 + bài cấp 1 bị đẩy xuống (loại trừ bài t1)
    const allTier2Candidates = [...pushedToTier2, ...rawTier2].filter(
      (a) => a.slug !== t1?.slug
    );
    // Cấp 2 chỉ hiển thị tối đa 5 bài bên cạnh
    const t2 = allTier2Candidates.slice(0, 5);
    // Nếu cấp 2 quá 5 bài thì tự đẩy xuống cấp 3
    const pushedToTier3 = allTier2Candidates.slice(5);

    // 3. Cấp 3: Các bài được gán cấp 3 + các bài cấp 2 bị đẩy xuống (loại trừ t1 và t2)
    const usedSlugs = new Set([
      ...(t1 ? [t1.slug] : []),
      ...t2.map((a) => a.slug),
    ]);
    const t3 = [...pushedToTier3, ...rawTier3].filter(
      (a) => !usedSlugs.has(a.slug)
    );

    return {
      leadArticle: t1,
      sidebarArticles: t2,
      bottomArticles: t3,
    };
  }, [articleList]);

  const handleOpenArticle = (article: NewsArticle) => {
    setSelectedArticle(article);
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
  };

  return (
    <div className="newspaper-page">
      <div className="newspaper-page__container">
        {/* KHÔNG CÒN MASTHEAD DÀI DÒNG, KHÔNG CÒN THANH TAB, KHÔNG CÒN TÌM KIẾM */}

        {/* TẦNG TRÊN: PHÂN CHIA GIỮA CẤP 1 (BÀI LỚN NHẤT) VÀ CẤP 2 (BÀI BÊN CẠNH) */}
        <section className="newspaper-hero-split" aria-label="Bản tin chính">
          {/* CỘT TRÁI: CẤP 1 — BÀI LỚN NHẤT */}
          <div className="newspaper-hero-split__main">
            {leadArticle && (
              <article
                className="newspaper-lead-card"
                onClick={() => handleOpenArticle(leadArticle)}
                tabIndex={0}
                role="button"
                aria-label={`Đọc bài viết: ${leadArticle.title}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleOpenArticle(leadArticle);
                  }
                }}
              >
                <div className="newspaper-lead-card__media">
                  <Image
                    src={leadArticle.coverImage ?? "/images/bgm23.jpg"}
                    alt={leadArticle.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 65vw"
                    className="newspaper-lead-card__image"
                    priority
                    unoptimized
                  />
                </div>

                <div className="newspaper-lead-card__body">
                  <div className="newspaper-lead-card__meta">
                    <time dateTime={leadArticle.publishedAt} className="newspaper-card-datetime">
                      {formatArticleDateTime(leadArticle.publishedAt)}
                    </time>
                  </div>

                  <h2 className="newspaper-lead-card__title">{leadArticle.title}</h2>

                  <p className="newspaper-lead-card__excerpt">{leadArticle.excerpt}</p>

                  <div className="newspaper-lead-card__footer">
                    <span className="newspaper-read-more">
                      Xem chi tiết nội dung <span aria-hidden="true">➔</span>
                    </span>
                  </div>
                </div>
              </article>
            )}
          </div>

          {/* CỘT PHẢI: BÀI BÊN CẠNH */}
          <aside className="newspaper-hero-split__sidebar" aria-label="Bài viết bên cạnh">

            <div className="newspaper-vertical-feed">
              {sidebarArticles.map((art) => (
                  <article
                    className="newspaper-sidebar-item"
                    key={art.slug}
                    onClick={() => handleOpenArticle(art)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Đọc bài viết: ${art.title}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleOpenArticle(art);
                      }
                    }}
                  >
                    <div className="newspaper-sidebar-item__media">
                      <Image
                        src={art.coverImage ?? "/images/bgm23.jpg"}
                        alt={art.title}
                        fill
                        sizes="120px"
                        className="newspaper-sidebar-item__img"
                        unoptimized
                      />
                    </div>

                    <div className="newspaper-sidebar-item__content">
                      <time dateTime={art.publishedAt} className="newspaper-card-datetime">
                        {formatArticleDateTime(art.publishedAt)}
                      </time>

                      <h4 className="newspaper-sidebar-item__title">{art.title}</h4>

                      <p className="newspaper-sidebar-item__excerpt">{art.excerpt}</p>
                    </div>
                  </article>
                ))}
            </div>
          </aside>
        </section>

        {/* TẦNG DƯỚI CÙNG: CÁC BÀI KHÁC */}
        {bottomArticles.length > 0 && (
          <section className="newspaper-bottom-section" aria-label="Bài viết khác">
            <div className="newspaper-bottom-grid">
              {bottomArticles.map((art) => (
                <article
                  className="newspaper-card"
                  key={art.slug}
                  onClick={() => handleOpenArticle(art)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Đọc bài viết: ${art.title}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleOpenArticle(art);
                    }
                  }}
                >
                  <div className="newspaper-card__media">
                    <Image
                      src={art.coverImage ?? "/images/pappermap.png"}
                      alt={art.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="newspaper-card__image"
                      unoptimized
                    />
                  </div>

                  <div className="newspaper-card__body">
                    <time dateTime={art.publishedAt} className="newspaper-card-datetime">
                      {formatArticleDateTime(art.publishedAt)}
                    </time>

                    <h4 className="newspaper-card__title">{art.title}</h4>

                    <p className="newspaper-card__excerpt">{art.excerpt}</p>

                    <span className="newspaper-card__read-link">
                      Xem bài viết ➔
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* MODAL ĐỌC CHI TIẾT NỘI DUNG CHÍNH CỦA BÀI VIẾT */}
      <GameModal
        open={Boolean(selectedArticle)}
        onCancel={handleCloseArticle}
        title={selectedArticle?.title ?? "Chi Tiết Bản Tin"}
        width={780}
        footer={null}
      >
        {selectedArticle && (
          <div className="article-modal-content">
            {selectedArticle.coverImage && (
              <div className="article-modal-cover">
                <Image
                  src={selectedArticle.coverImage}
                  alt={selectedArticle.title}
                  fill
                  sizes="780px"
                  className="article-modal-cover__img"
                  unoptimized
                />
              </div>
            )}

            <div className="article-modal-meta">
              <span className="article-modal-date">
                ⏰ Đăng lúc: <strong>{formatArticleDateTime(selectedArticle.publishedAt)}</strong>
              </span>
              <span className="newspaper-badge newspaper-badge--mini">
                {selectedArticle.tier === 1
                  ? "⭐ Cấp 1"
                  : selectedArticle.tier === 2
                    ? "📌 Cấp 2"
                    : "📄 Cấp 3"}
              </span>
            </div>

            <h2 className="article-modal-title">{selectedArticle.title}</h2>

            {selectedArticle.excerpt && (
              <blockquote className="article-modal-lead">
                &quot;{selectedArticle.excerpt}&quot;
              </blockquote>
            )}

            <div className="article-modal-body">
              {selectedArticle.content ? (
                selectedArticle.content.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))
              ) : (
                <p>Nội dung chi tiết của bản tin đang được cập nhật.</p>
              )}
            </div>

            <div className="article-modal-footer">
              <button
                type="button"
                className="newspaper-btn-retro"
                onClick={handleCloseArticle}
              >
                Đóng bản tin (ESC)
              </button>
            </div>
          </div>
        )}
      </GameModal>
    </div>
  );
}

export { NewsPage };
export type { NewsPageProps };
