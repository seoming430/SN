// services/NewsApiService.ts
import axios, { AxiosError } from 'axios';
import { Platform, Alert } from 'react-native';
import { NewsItem, SummarizeResponse, NewsResponse } from '../types/news';

// 상수 정의
const API_CONFIG = {
  BASE_URL: 'https://5ce5f3e3f3c3.ngrok-free.app',
  TIMEOUT: 120000,
  HEALTH_CHECK_TIMEOUT: 5000,
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'User-Agent': 'SummaNews-App/1.0',
  },
  SUPPORTED_CATEGORIES: [
    '정치', '경제', '사회', '생활·문화', '연예', '스포츠', '건강', '오늘의추천'
  ],
  TRENDING_CATEGORY: '오늘의추천',
  MAX_TRENDING_ITEMS: 5,
  MAX_SEARCH_RESULTS: 20,
} as const;

export class NewsApiService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // 공통 HTTP 헤더 생성
  private getHeaders(): Record<string, string> {
    return { ...API_CONFIG.DEFAULT_HEADERS };
  }

  // 공통 axios 설정 생성
  private getAxiosConfig(timeout?: number) {
    return {
      timeout: timeout || this.timeout,
      headers: this.getHeaders(),
    };
  }

  // 뉴스 아이템 변환 공통 함수
  private transformNewsItem(item: any, category: string, index?: number): NewsItem {
    const stableId = this.generateStableId(item.title, item.link || '', category);
    return {
      id: stableId,
      category: category,
      title: item.title,
      subtitle: item.preview_summary || item.description || '',
      summary: item.detailed_summary || item.preview_summary || item.description,
      originalUrl: item.link || '',
      date: item.pub_date || new Date().toLocaleDateString('ko-KR'),
      source: category === API_CONFIG.TRENDING_CATEGORY ? '트렌딩 뉴스' : '네이버뉴스',
      image: item.image_url || this.getDefaultImage(category, index),
      ...(index !== undefined && { trend_rank: index + 1 }),
    };
  }

  // 기본 이미지 URL 생성
  private getDefaultImage(category: string, index?: number): string {
    const color = category === API_CONFIG.TRENDING_CATEGORY ? 'EF4444' : '4A90E2';
    const text = index !== undefined ? `${category}${index + 1}` : category;
    return `https://via.placeholder.com/300x150/${color}/FFFFFF?text=${encodeURIComponent(text)}`;
  }

  // 서버 상태 확인 - 여러 엔드포인트 시도
  async checkServerHealth(): Promise<boolean> {
    const endpoints = [
      { path: '/test', name: 'Test' }, // 서버에서 지원하는 테스트 엔드포인트
      { path: '/api/categories', name: 'Categories API' }, // 카테고리 목록 API
      { path: '/', name: 'Root' }, // 루트 경로 테스트
    ];

    console.log(`🔍 Checking server health at: ${this.baseUrl}`);
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🌐 Testing ${endpoint.name} endpoint: ${this.baseUrl}${endpoint.path}`);
        const response = await axios.get(`${this.baseUrl}${endpoint.path}`, {
          ...this.getAxiosConfig(API_CONFIG.HEALTH_CHECK_TIMEOUT),
        });
        
        console.log(`✅ ${endpoint.name} endpoint successful:`, response.status);
        
        if (response.status >= 200 && response.status < 300) {
          return true;
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status === 404 || status === 405) {
            console.log(`⚠️ ${endpoint.name} endpoint not found (${status}) - server may not be properly configured`);
            // 404/405는 서버가 응답하지만 API가 제대로 설정되지 않았다는 의미
            continue; // 다음 엔드포인트 시도
          }
          console.log(`⚠️ ${endpoint.name} endpoint failed: ${status} - ${error.message}`);
        } else {
          console.log(`💥 ${endpoint.name} endpoint unknown error:`, error as Error);
        }
      }
    }
    
    console.log('❌ All endpoints failed - server may not be running properly');
    return false;
  }

  // 뉴스 카테고리별 데이터를 가져오는 메서드
  async getNewsByCategory(category: string): Promise<NewsItem[]> {
    console.log(`📡 ${category} 뉴스 요청 중...`);
    
    // 실제 API 연결을 위한 코드
    try {
      const response = await axios.get(`${this.baseUrl}/api/news/${encodeURIComponent(category)}`, {
        ...this.getAxiosConfig(120000), // AI 처리 시간 고려하여 120초
      });
      
      if (response.data.news) {
        return response.data.news.map((item: any, index: number) => 
          this.transformNewsItem(item, category, index)
        );
      } else {
        console.warn('알 수 없는 응답 형식:', response.data);
        return [];
      }
    } catch (error) {
      // 404/405 오류는 서버에서 해당 카테고리를 지원하지 않는 것이므로 간단히 로그만 출력
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404 || status === 405) {
          console.log(`⚠️ ${category} 카테고리는 서버에서 지원되지 않습니다.`);
        } else {
          console.error(`❌ ${category} 뉴스 로드 실패 (${status}):`, error.message);
        }
      } else {
        console.error(`❌ ${category} 뉴스 로드 실패:`, error);
      }
      
      // 모든 오류인 경우 빈 배열 반환
      return [];
    }
  }



  // 뉴스 URL을 요약하는 API 호출 - 개선된 버전
  async summarizeNews(url: string): Promise<SummarizeResponse | null> {
    try {
      // URL 유효성 검사
      if (!url || !this.isValidUrl(url)) {
        throw new Error('Invalid URL provided');
      }

      console.log(`Attempting to summarize: ${url}`);
      console.log(`API endpoint: ${this.baseUrl}/summarize`);

      const response = await axios.post<SummarizeResponse>(
        `${this.baseUrl}/summarize`,
        { url },
        {
          ...this.getAxiosConfig(),
          validateStatus: (status: number) => status < 500,
        }
      );

      return response.data;
    } catch (error) {
      this.handleError(error, url);
      return null;
    }
  }


  // 트렌딩 뉴스 데이터 가져오기 - 개선된 버전
  async getTrendingNews(): Promise<NewsItem[]> {
    console.log('🔥 트렌딩 뉴스 요청 중...');
    
    // 실제 API 연결을 위한 코드
    const isServerHealthy = await this.checkServerHealth();
    if (!isServerHealthy) {
      console.warn('Server is not available, returning empty array');
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/api/news/${API_CONFIG.TRENDING_CATEGORY}`, {
        ...this.getAxiosConfig(),
      });
      
      if (response.data.news) {
        const trendingItems = response.data.news
          .slice(0, API_CONFIG.MAX_TRENDING_ITEMS)
          .map((item: any, index: number) => 
            this.transformNewsItem(item, API_CONFIG.TRENDING_CATEGORY, index)
          );
        
        console.log(`✅ ${trendingItems.length}개의 트렌딩 뉴스 로드 성공`);
        return trendingItems;
      }
      
      console.warn('트렌딩 뉴스 응답 형식 오류');
      return [];
      
    } catch (error) {
      // 404/405 오류는 서버에서 해당 카테고리를 지원하지 않는 것이므로 간단히 로그만 출력
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404 || status === 405) {
          console.log(`⚠️ 오늘의추천 카테고리는 서버에서 지원되지 않습니다.`);
        } else {
          console.error(`❌ 트렌딩 뉴스 로드 실패 (${status}):`, error.message);
        }
      } else {
        console.error(`❌ 트렌딩 뉴스 로드 실패:`, error);
      }
      
      return [];
    }
  }

  // 서버 URL 변경 (디버깅용)
  setBaseUrl(newBaseUrl: string): void {
    this.baseUrl = newBaseUrl;
    console.log(`Base URL changed to: ${this.baseUrl}`);
  }

  // 현재 서버 URL 확인
  getBaseUrlInfo(): string {
    return this.baseUrl;
  }


  // 에러 처리 함수
  private handleError(error: any, url: string): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.code === 'ECONNREFUSED') {
        console.error(`❌ 서버 연결 거부 - 서버가 실행 중인지 확인하세요. URL: ${url}`);
      } else if (axiosError.code === 'ETIMEDOUT') {
        console.error(`⏰ 요청 시간 초과. URL: ${url}`);
      } else if (axiosError.code === 'ENOTFOUND') {
        console.error(`🌐 DNS 해석 실패 - 네트워크 연결을 확인하세요. URL: ${url}`);
      } else if (axiosError.message === 'Network Error') {
        console.error(`🔌 네트워크 오류 - 서버 상태와 CORS 설정을 확인하세요. URL: ${url}`);
      } else {
        console.error(`🚫 Axios 오류 (${axiosError.code}): ${axiosError.message}. URL: ${url}`);
      }
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        console.error(`📡 HTTP ${status}: ${axiosError.response.statusText}. URL: ${url}`);
      }
    } else {
      console.error(`💥 예상치 못한 오류. URL: ${url}`, error);
    }
  }

  // URL 유효성 검사
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // 지연 함수
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 안정적인 뉴스 ID 생성 (제목과 URL 기반)
  private generateStableId(title: string, url: string, category: string): string {
    // 제목과 URL을 조합하여 해시 생성
    const text = `${title}_${url}_${category}`.toLowerCase().replace(/\s+/g, '');
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    return `news_${Math.abs(hash)}`;
  }


  // 뉴스 검색 메서드 추가
  async searchNews(query: string): Promise<NewsItem[]> {
    try {
      console.log(`🔍 뉴스 검색 중: ${query}`);
      
      // 지원하는 카테고리에서 검색
      const searchResults: NewsItem[] = [];
      
      for (const category of API_CONFIG.SUPPORTED_CATEGORIES) {
        const categoryNews = await this.getNewsByCategory(category);
        const filtered = categoryNews.filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          (item.summary && item.summary.toLowerCase().includes(query.toLowerCase()))
        );
        searchResults.push(...filtered);
      }
      
      // 중복 제거 및 최대 결과 반환
      const uniqueResults = Array.from(
        new Map(searchResults.map(item => [item.id, item])).values()
      ).slice(0, API_CONFIG.MAX_SEARCH_RESULTS);
      
      console.log(`✅ ${uniqueResults.length}개의 검색 결과`);
      return uniqueResults;
      
    } catch (error) {
      console.error('뉴스 검색 실패:', error);
      return [];
    }
  }

}