type NewsCategory = "TIN TỨC" | "CỘNG ĐỒNG" | "SỰ KIỆN" | "KHÁM PHÁ" | "HƯỚNG DẪN";

interface NewsArticle {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  category: NewsCategory;
  author: string;
  authorRole?: string;
  publishedAt: string;
  readTime?: string;
  coverImage?: string;
  featured?: boolean;
  hot?: boolean;
  tier?: number; // 1: Bài chính lớn nhất, 2: Bài bên cạnh (max 5), 3: Bài dưới cùng
  tags?: string[];
  views?: number;
}

interface CommunityThread extends NewsArticle {
  category: "CỘNG ĐỒNG";
  replyCount: number;
  participantCount: number;
}

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  participantCount: number;
  capacity: number | null;
}

type NewsItem = NewsArticle | CommunityThread;

interface CreateArticlePayload {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  category: NewsCategory;
  author?: string;
  authorRole?: string;
  readTime?: string;
  coverImage?: string;
  featured?: boolean;
  hot?: boolean;
  tier?: number;
  tags?: string[];
  publishedAt?: string;
}

export type {
  NewsArticle,
  NewsCategory,
  CommunityThread,
  CommunityEvent,
  NewsItem,
  CreateArticlePayload,
};

