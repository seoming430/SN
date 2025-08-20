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

export type ServerStatus = 'unknown' | 'online' | 'offline';

export type TabType = '오늘의 추천' | '뉴스' | '프로필';

export type CategoryType = '정치' | '경제' | 'IT/과학' | '문화' | '세계' | '스포츠';