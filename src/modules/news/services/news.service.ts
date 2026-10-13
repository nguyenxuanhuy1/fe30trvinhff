import { api } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type { CreateArticlePayload, NewsArticle } from "../types";

interface ArticleListResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  articles: NewsArticle[];
}

// Lấy danh sách bài viết từ Backend API (công khai)
async function getArticles(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ArticleListResponse> {
  const res = await api.get<ApiResponse<ArticleListResponse>>("/articles", { params });
  return res.data.data;
}

// Xem chi tiết bài viết (công khai)
async function getArticle(idOrSlug: string): Promise<NewsArticle> {
  const res = await api.get<ApiResponse<NewsArticle>>(`/articles/${idOrSlug}`);
  return res.data.data;
}

// Thêm bài viết mới (chỉ Admin)
async function createArticle(payload: CreateArticlePayload): Promise<NewsArticle> {
  const res = await api.post<ApiResponse<NewsArticle>>("/articles", payload);
  return res.data.data;
}

// Cập nhật bài viết (chỉ Admin)
async function updateArticle(
  id: string,
  payload: Partial<CreateArticlePayload>,
): Promise<NewsArticle> {
  const res = await api.put<ApiResponse<NewsArticle>>(`/articles/${id}`, payload);
  return res.data.data;
}

// Xoá bài viết (chỉ Admin)
async function deleteArticle(id: string): Promise<{ id: string }> {
  const res = await api.delete<ApiResponse<{ id: string }>>(`/articles/${id}`);
  return res.data.data;
}

export { getArticles, getArticle, createArticle, updateArticle, deleteArticle };
export type { ArticleListResponse };
