// services/NewsApiService.ts
import axios, { AxiosError } from 'axios';
import { Platform, Alert } from 'react-native';
import { NewsItem, SummarizeResponse, NewsResponse } from '../types/news';

export class NewsApiService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    // 플랫폼에 따른 기본 URL 설정
    this.baseUrl = this.getBaseUrl();
    this.timeout = 30000; // 30초 타임아웃
  }

  private getBaseUrl(): string {
    if (Platform.OS === 'android') {
      // Android 에뮬레이터에서는 10.0.2.2 사용
      return 'http://10.0.2.2:5000';
    } else if (Platform.OS === 'ios') {
      // iOS 시뮬레이터에서는 localhost 사용
      return 'http://localhost:5000';
    }
    // 실제 기기에서는 컴퓨터의 실제 IP 주소 사용 (필요시 변경)
    // return 'http://192.168.1.100:5000';
    return 'http://localhost:5000';
  }

  // 서버 상태 확인
  async checkServerHealth(): Promise<boolean> {
    try {
      console.log(`Checking server health at: ${this.baseUrl}`);
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000,
      });
      console.log('Server health check successful');
      return response.status === 200;
    } catch (error) {
      console.error('Server health check failed:', error);
      return false;
    }
  }

  // 뉴스 카테고리별 데이터를 가져오는 메서드
  async getNewsByCategory(category: string): Promise<NewsItem[]> {
    try {
      const response = await axios.get<NewsResponse>(`${this.baseUrl}/api/news/${category}`, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      return response.data.news || [];
    } catch (error) {
      console.error(`Failed to fetch news for category ${category}:`, error);
      return this.getMockNewsByCategory(category);
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
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          validateStatus: (status) => status < 500,
        }
      );

      return response.data;
    } catch (error) {
      this.handleError(error, url);
      return null;
    }
  }

  // 재시도 로직이 포함된 요약 함수
  async summarizeNewsWithRetry(url: string, maxRetries: number = 2): Promise<SummarizeResponse | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries} for URL: ${url}`);
        
        const result = await this.summarizeNews(url);
        if (result) {
          console.log(`Successfully summarized on attempt ${attempt}: ${url}`);
          return result;
        }
      } catch (error) {
        console.warn(`Attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          console.error(`All ${maxRetries} attempts failed for URL: ${url}`);
          return null;
        }
        
        // 지수 백오프: 1초, 2초 대기
        const delay = Math.pow(2, attempt - 1) * 1000;
        await this.sleep(delay);
      }
    }
    return null;
  }

  // 트렌딩 뉴스 데이터 가져오기 - 개선된 버전
  async getTrendingNews(): Promise<NewsItem[]> {
    // 먼저 서버 상태 확인
    const isServerHealthy = await this.checkServerHealth();
    if (!isServerHealthy) {
      console.warn('Server is not available, using mock data');
      return this.getMockTrendingNews();
    }

    const trendingUrls = [
      'https://news.example.com/article1',
      'https://news.example.com/article2', 
      'https://news.example.com/article3',
    ];

    try {
      // Promise.allSettled를 사용하여 일부 실패해도 다른 결과는 받을 수 있도록 함
      const summaryPromises = trendingUrls.map(async (url, index): Promise<NewsItem | null> => {
        try {
          const summaryData = await this.summarizeNewsWithRetry(url, 2);
          
          if (!summaryData) {
            console.warn(`No summary data for URL: ${url}, using fallback`);
            return this.createFallbackNewsItem(url, index);
          }

          return {
            id: `trending_${index + 1}`,
            category: summaryData.category || '일반',
            title: summaryData.title || `뉴스 제목 ${index + 1}`,
            subtitle: (summaryData.summary || '요약 내용이 없습니다').substring(0, 50) + '...',
            summary: summaryData.summary || '요약 내용이 없습니다.',
            originalUrl: url,
            date: new Date().toLocaleDateString('ko-KR'),
            source: '트렌딩 뉴스',
            image: `https://via.placeholder.com/300x150/4A90E2/FFFFFF?text=${encodeURIComponent(summaryData.category || '뉴스')}`,
            trend_rank: index + 1,
          };
        } catch (error) {
          console.error(`Failed to summarize URL ${url}:`, error);
          return this.createFallbackNewsItem(url, index);
        }
      });

      const results = await Promise.allSettled(summaryPromises);
      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<NewsItem | null> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value!);

      // 성공한 결과가 없으면 목업 데이터 반환
      if (successfulResults.length === 0) {
        console.warn('No successful API calls, using mock data');
        return this.getMockTrendingNews();
      }

      return successfulResults;
    } catch (error) {
      console.error('Failed to fetch trending news:', error);
      return this.getMockTrendingNews();
    }
  }

  // API 테스트 함수 - 개선된 버전
  async testSummarize(url: string): Promise<void> {
    try {
      // 먼저 서버 상태 확인
      const isHealthy = await this.checkServerHealth();
      if (!isHealthy) {
        Alert.alert(
          '서버 연결 실패', 
          `서버가 응답하지 않습니다.\n\n확인사항:\n1. Flask 서버가 실행 중인지 확인\n2. 서버 주소: ${this.baseUrl}\n3. 방화벽 설정 확인`,
          [{ text: '확인' }]
        );
        return;
      }

      const result = await this.summarizeNewsWithRetry(url, 3);
      
      if (result) {
        Alert.alert(
          '✅ API 테스트 성공!', 
          `제목: ${result.title}\n카테고리: ${result.category}\n요약: ${result.summary.substring(0, 100)}...`,
          [{ text: '확인' }]
        );
      } else {
        Alert.alert(
          '⚠️ API 응답 없음', 
          '서버에서 유효한 응답을 받지 못했습니다. 서버 로그를 확인해주세요.',
          [{ text: '확인' }]
        );
      }
    } catch (error) {
      Alert.alert(
        '❌ API 테스트 실패', 
        `오류가 발생했습니다:\n${error}\n\n서버 상태를 확인해주세요.`,
        [{ text: '확인' }]
      );
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

  // 대체 뉴스 아이템 생성
  private createFallbackNewsItem(url: string, index: number): NewsItem {
    return {
      id: `trending_fallback_${index + 1}`,
      category: '일반',
      title: `뉴스 제목 ${index + 1}`,
      subtitle: 'API 연결 실패로 인한 대체 내용입니다...',
      summary: 'API 서버에 연결할 수 없어 요약을 가져올 수 없습니다. 나중에 다시 시도해주세요.',
      originalUrl: url,
      date: new Date().toLocaleDateString('ko-KR'),
      source: '트렌딩 뉴스',
      image: 'https://via.placeholder.com/300x150/6C757D/FFFFFF?text=오프라인',
      trend_rank: index + 1,
    };
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

  // 테스트용 더미 데이터 - 트렌딩 뉴스
  private getMockTrendingNews(): NewsItem[] {
    return [
      {
        id: 'trend1',
        category: '정치',
        title: '국정감사 주요 쟁점 정리',
        subtitle: '여야 간 치열한 공방이 예상되는 가운데...',
        summary: '올해 국정감사에서는 경제정책, 부동산 대책, 외교안보 등이 주요 쟁점으로 부상할 전망입니다. 여당과 야당 간의 치열한 공방이 예상되며, 특히 민생경제 관련 정책들에 대한 집중적인 검토가 이뤄질 것으로 보입니다.',
        originalUrl: 'https://news.example.com/politics1',
        date: new Date().toLocaleDateString('ko-KR'),
        source: '트렌딩 뉴스',
        image: 'https://via.placeholder.com/300x150/EF4444/FFFFFF?text=정치',
        trend_rank: 1,
      },
      {
        id: 'trend2',
        category: '경제',
        title: '한국은행 기준금리 동결 결정',
        subtitle: '물가 안정과 경제성장 균형 고려...',
        summary: '한국은행이 기준금리를 현 수준에서 동결하기로 결정했습니다. 이는 최근 물가 안정세와 경제성장률을 종합적으로 고려한 결과로, 시장에서는 당분간 금리 안정기조가 지속될 것으로 전망하고 있습니다.',
        originalUrl: 'https://news.example.com/economy1',
        date: new Date().toLocaleDateString('ko-KR'),
        source: '트렌딩 뉴스',
        image: 'https://via.placeholder.com/300x150/10B981/FFFFFF?text=경제',
        trend_rank: 2,
      },
      {
        id: 'trend3',
        category: 'IT/과학',
        title: 'AI 반도체 시장 급성장',
        subtitle: '글로벌 기업들의 투자 경쟁 가속화...',
        summary: 'AI 기술 발전과 함께 관련 반도체 시장이 급속도로 성장하고 있습니다. 주요 글로벌 기업들이 AI 칩 개발에 대규모 투자를 진행하고 있으며, 이는 반도체 산업 전체의 패러다임 변화를 이끌고 있습니다.',
        originalUrl: 'https://news.example.com/tech1',
        date: new Date().toLocaleDateString('ko-KR'),
        source: '트렌딩 뉴스',
        image: 'https://via.placeholder.com/300x150/6366F1/FFFFFF?text=AI반도체',
        trend_rank: 3,
      },
    ];
  }

  // 테스트용 더미 데이터 - 카테고리별 뉴스
  private getMockNewsByCategory(category: string): NewsItem[] {
    const mockData: { [key: string]: NewsItem[] } = {
      '전체': [
        {
          id: '1',
          category: '한국 경제',
          title: '4월 경상수지 57억 달러 흑자',
          subtitle: '24개월 연속 흑자 기록',
          date: '2023.06.10',
          source: '연합뉴스',
          image: 'https://via.placeholder.com/300x150/4A90E2/FFFFFF?text=경제뉴스',
          summary: '한국의 경상수지가 24개월 연속 흑자를 기록했습니다.',
        },
        {
          id: '2',
          category: 'IT/과학',
          title: 'AI 기술 발전으로 산업 혁신',
          subtitle: '새로운 시대의 도래',
          date: '2023.06.08',
          source: '테크뉴스',
          image: 'https://via.placeholder.com/300x150/6366F1/FFFFFF?text=AI기술',
          summary: 'AI 기술이 다양한 산업 분야에서 혁신을 이끌고 있습니다.',
        },
      ],
      '경제': [
        {
          id: 'eco1',
          category: '한국 경제',
          title: '코스피 2600선 회복',
          subtitle: '외국인 매수세 지속',
          date: '2023.06.10',
          source: '매일경제',
          image: 'https://via.placeholder.com/300x150/EF4444/FFFFFF?text=주식시장',
          summary: '코스피가 외국인 매수세에 힘입어 2600선을 회복했습니다.',
        }
      ],
      'IT/과학': [
        {
          id: 'tech1',
          category: 'IT/과학',
          title: '삼성 차세대 반도체 공개',
          subtitle: '3나노 공정 기술 혁신',
          date: '2023.06.09',
          source: '전자신문',
          image: 'https://via.placeholder.com/300x150/8B5CF6/FFFFFF?text=반도체',
          summary: '삼성이 3나노 공정 기술을 적용한 차세대 반도체를 공개했습니다.',
        }
      ]
    };
    
    return mockData[category] || mockData['전체'];
  }
}