// types/news.ts
export interface NewsItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  date: string;
  source: string;
  image: string;
  summary?: string;
  readTime?: string;
  isBookmarked?: boolean;
  trend_rank?: number;
  originalUrl?: string;
}

export interface SummarizeResponse {
  summary: string;
  title: string;
  category: string;
}

export interface NewsResponse {
  news: NewsItem[];
}

export type ServerStatus = 'unknown' | 'online' | 'offline' | 'connected' | 'connecting' | 'error';

export type TabType = 'home' | 'trending' | 'search' | 'profile';

export type CategoryType = '정치' | '경제' | 'IT/과학' | '생활·문화' | '세계' | '스포츠';