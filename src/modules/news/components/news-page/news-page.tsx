"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import type { NewsArticle } from "../../types";
import { getArticles } from "../../services/news.service";
import { GameModal } from "@/components/ui/game-modal";
import { EmptyState, ErrorState, NewsPageSkeleton } from "@/components/ui";
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

function NewsPage({ articles }: NewsPageProps) {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  // Tải danh sách bài viết thời gian thực từ Backend API qua React Query (cache 5 phút)
  const {
    data: articleList = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["news-articles"],
    queryFn: async () => {
      const res = await getArticles({ limit: 100 });
      return res?.articles ?? [];
    },
    initialData: articles && articles.length > 0 ? articles : undefined,
  });

  // Tự động phân cấp hiển thị & xếp bài theo quy tắc:
  // - Cấp 1: Bài lớn nhất ở vị trí chính
  // - Cấp 2: Bài bên cạnh (tối đa 5 bài). Khi có bài cấp 1 mới, bài cấp 1 cũ tự đẩy xuống cấp 2.
  // - Cấp 3: Bài dưới cùng. Khi bài cấp 2 quá 5 bài, các bài dư tự động đẩy xuống cấp 3.
  const { leadArticle, sidebarArticles, bottomArticles } = useMemo(() => {
    if (!articleList || articleList.length === 0) {
      return { leadArticle: null, sidebarArticles: [], bottomArticles: [] };
    }

    const rawTier1 = articleList.filter((a) => a.tier === 1 || (a.tier === undefined && a.featured));
    const rawTier2 = articleList.filter((a) => a.tier === 2);
    const rawTier3 = articleList.filter((a) => a.tier === 3 || (a.tier === undefined && !a.featured));

    // 1. Cấp 1: 1 bài mới nhất làm Cấp 1
    let t1: NewsArticle | null = null;
    const pushedToTier2: NewsArticle[] = [];

    if (rawTier1.length > 0) {
      t1 = rawTier1[0];
      pushedToTier2.push(...rawTier1.slice(1));
    } else {
      t1 = articleList[0];
    }

    // 2. Cấp 2: Các bài được gán cấp 2 + bài cấp 1 bị đẩy xuống (loại trừ bài t1)
    const allTier2Candidates = [...pushedToTier2, ...rawTier2].filter(
      (a) => a.slug !== t1?.slug
    );
    const t2 = allTier2Candidates.slice(0, 5);
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

  if (isError) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }

  return (
    <div className="newspaper-page">
      <div className="newspaper-page__container">
        {isLoading && articleList.length === 0 ? (
          <NewsPageSkeleton />
        ) : articleList.length === 0 ? (
          <EmptyState
            icon="📰"
            title="Chưa có bài viết nào"
            description="Các bản tin và bài viết mới đang được cập nhật. Vui lòng quay lại sau nhé!"
          />
        ) : (
          <>
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
                    {leadArticle.coverImage && (
                      <div className="newspaper-lead-card__media">
                        <Image
                          src={leadArticle.coverImage}
                          alt={leadArticle.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 65vw"
                          className="newspaper-lead-card__image"
                          priority
                          unoptimized
                        />
                      </div>
                    )}

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
              {sidebarArticles.length > 0 && (
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
                        {art.coverImage && (
                          <div className="newspaper-sidebar-item__media">
                            <Image
                              src={art.coverImage}
                              alt={art.title}
                              fill
                              sizes="120px"
                              className="newspaper-sidebar-item__img"
                              unoptimized
                            />
                          </div>
                        )}

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
              )}
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
                      {art.coverImage && (
                        <div className="newspaper-card__media">
                          <Image
                            src={art.coverImage}
                            alt={art.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="newspaper-card__image"
                            unoptimized
                          />
                        </div>
                      )}

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
          </>
        )}
      </div>

      {/* MODAL ĐỌC CHI TIẾT BÀI VIẾT: GỌN GÀNG, DỄ NHÌN, KHÔNG MÀU MÈ */}
      <GameModal
        open={Boolean(selectedArticle)}
        onCancel={handleCloseArticle}
        title={null}
        width={760}
        footer={null}
        className="article-reader-modal"
      >
        {selectedArticle && (
          <div className="article-modal-simple">
            <div className="article-modal-simple__scroll">
              {/* 1. Ảnh bìa bài viết nếu có */}
              {selectedArticle.coverImage && (
                <div className="article-modal-simple__cover">
                  <Image
                    src={selectedArticle.coverImage}
                    alt={selectedArticle.title}
                    fill
                    sizes="(max-width: 760px) 100vw, 760px"
                    className="article-modal-simple__cover-img"
                    unoptimized
                  />
                </div>
              )}

              {/* 2. Tiêu đề bài viết */}
              <h2 className="article-modal-simple__title">{selectedArticle.title}</h2>

              {/* 3. Dòng thông tin tác giả, ngày tháng, chuyên mục */}
              <div className="article-modal-simple__meta">
                <span className="article-modal-simple__date">
                  📅 {formatArticleDateTime(selectedArticle.publishedAt)}
                </span>
                {selectedArticle.category && (
                  <span className="article-modal-simple__category">
                    {selectedArticle.category}
                  </span>
                )}
                {selectedArticle.author && (
                  <span className="article-modal-simple__author">
                    Tác giả: {selectedArticle.author}
                    {selectedArticle.authorRole ? ` (${selectedArticle.authorRole})` : ""}
                  </span>
                )}
              </div>

              {/* 4. Đoạn mô tả / tóm tắt */}
              {selectedArticle.excerpt && (
                <div className="article-modal-simple__excerpt">
                  {selectedArticle.excerpt}
                </div>
              )}

              {/* 5. Nội dung chính bài viết */}
              <div className="article-modal-simple__content">
                {selectedArticle.content ? (
                  selectedArticle.content.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))
                ) : (
                  <p>Nội dung chi tiết của bản tin đang được cập nhật.</p>
                )}
              </div>

              {/* 6. Tags chủ đề */}
              {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                <div className="article-modal-simple__tags">
                  <span className="article-modal-simple__tags-label">Chủ đề:</span>
                  {selectedArticle.tags.map((tag, i) => (
                    <span key={i} className="article-modal-simple__tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 7. Nút đóng đơn giản ở chân modal */}
              <div className="article-modal-simple__footer">
                <button
                  type="button"
                  className="article-modal-simple__close-btn"
                  onClick={handleCloseArticle}
                >
                  Đóng bài viết
                </button>
              </div>
            </div>
          </div>
        )}
      </GameModal>
    </div>
  );
}

export { NewsPage };
export type { NewsPageProps };
