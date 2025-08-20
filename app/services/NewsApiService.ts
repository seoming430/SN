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
    // ngrok URL 사용 - 코랩 서버 URL로 변경하세요
    return 'https://a29743cb20c1.ngrok-free.app';
  }

  // 서버 상태 확인 - 여러 엔드포인트 시도
  async checkServerHealth(): Promise<boolean> {
    const endpoints = [
      { path: '/api/health', name: 'Health' },
      { path: '/api/test', name: 'Test' },
    ];

    console.log(`🔍 Checking server health at: ${this.baseUrl}`);
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🌐 Testing ${endpoint.name} endpoint: ${this.baseUrl}${endpoint.path}`);
        const response = await axios.get(`${this.baseUrl}${endpoint.path}`, {
          timeout: 5000,
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'SummaNews-App/1.0',
          },
        });
        
        console.log(`✅ ${endpoint.name} endpoint successful:`, response.status);
        
        if (response.status >= 200 && response.status < 300) {
          return true;
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.log(`⚠️ ${endpoint.name} endpoint failed: ${error.response?.status} - ${error.message}`);
        } else {
          console.log(`💥 ${endpoint.name} endpoint unknown error:`, error as Error);
        }
      }
    }
    
    console.error('❌ All endpoints failed - server may not be running properly');
    return false;
  }

  // 뉴스 카테고리별 데이터를 가져오는 메서드
  async getNewsByCategory(category: string): Promise<NewsItem[]> {
    console.log(`📡 ${category} 뉴스 요청 중...`);
    
    // 실제 API 연결을 위한 코드
    try {
      const categoryMapping: { [key: string]: string } = {
        '정치': 'politics',
        '경제': 'economy',
        'IT/과학': 'tech',
        '문화': 'lifestyle',
        '세계': 'world',
        '스포츠': 'sports',
        '사회': 'society',
        '건강': 'health',
        '연예': 'entertainment'
      };
      
      const englishCategory = categoryMapping[category] || category.toLowerCase();
      
      // 임시로 모든 카테고리를 politics로 변경 (서버가 다른 카테고리를 지원하지 않는 것 같음)
      const response = await axios.get(`${this.baseUrl}/api/news/politics`, {
        timeout: 60000, // 60초로 타임아웃 증가 (AI 처리 시간 고려)
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      
      if (response.data.status === 'success' && response.data.data) {
        return response.data.data.map((item: any, index: number) => ({
          id: `${category}_${index}`,
          category: category,
          title: item.original_title || item.title,
          subtitle: item.preview_summary || item.subtitle,
          summary: item.detailed_summary || item.summary,
          originalUrl: item.url || '',
          date: item.published_at || new Date().toLocaleDateString('ko-KR'),
          source: item.source || '네이버뉴스',
          image: `https://via.placeholder.com/300x150/4A90E2/FFFFFF?text=${encodeURIComponent(category)}`,
        }));
      } else if (response.data.news) {
        return response.data.news;
      } else {
        console.warn('알 수 없는 응답 형식:', response.data);
        return [];
      }
    } catch (error) {
      console.error(`Failed to fetch news for category ${category}:`, error);
      return []; // 더미 데이터 대신 빈 배열 반환
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
            'ngrok-skip-browser-warning': 'true',
          },
          validateStatus: (status: number) => status < 500,
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
    console.log('🔥 트렌딩 뉴스 요청 중...');
    
    // 실제 API 연결을 위한 코드
    const isServerHealthy = await this.checkServerHealth();
    if (!isServerHealthy) {
      console.warn('Server is not available, returning empty array');
      return [];
    }

    try {
      // 추천 뉴스 대신 정치 뉴스로 변경 (안정성 우선)
      const response = await axios.get(`${this.baseUrl}/api/news/politics`, {
        timeout: 30000, // 30초로 충분
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      
      if (response.data.status === 'success' && response.data.data) {
        const trendingItems = response.data.data.slice(0, 5).map((item: any, index: number) => ({
          id: `trending_${index + 1}`,
          category: item.category || '정치',
          title: item.original_title || item.title,
          subtitle: item.preview_summary || item.subtitle,
          summary: item.detailed_summary || item.summary,
          originalUrl: item.url || '',
          date: item.published_at || new Date().toLocaleDateString('ko-KR'),
          source: item.source || '트렌딩 뉴스',
          image: `https://via.placeholder.com/300x150/EF4444/FFFFFF?text=트렌딩${index + 1}`,
          trend_rank: index + 1,
        }));
        
        console.log(`✅ ${trendingItems.length}개의 트렌딩 뉴스 로드 성공`);
        return trendingItems;
      }
      
      console.warn('트렌딩 뉴스 응답 형식 오류');
      return [];
      
    } catch (error) {
      console.error('Failed to fetch trending news:', error);
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

  // 뉴스 검색 메서드 추가
  async searchNews(query: string): Promise<NewsItem[]> {
    try {
      console.log(`🔍 뉴스 검색 중: ${query}`);
      
      // 실제 API가 없는 경우 모든 카테고리에서 검색
      const allCategories = ['정치', '경제', 'IT/과학', '문화', '세계', '스포츠'];
      const searchResults: NewsItem[] = [];
      
      for (const category of allCategories) {
        const categoryNews = await this.getNewsByCategory(category);
        const filtered = categoryNews.filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          (item.summary && item.summary.toLowerCase().includes(query.toLowerCase()))
        );
        searchResults.push(...filtered);
      }
      
      // 중복 제거 및 최대 20개 결과 반환
      const uniqueResults = Array.from(
        new Map(searchResults.map(item => [item.id, item])).values()
      ).slice(0, 20);
      
      console.log(`✅ ${uniqueResults.length}개의 검색 결과`);
      return uniqueResults;
      
    } catch (error) {
      console.error('뉴스 검색 실패:', error);
      return [];
    }
  }

  // 테스트용 더미 데이터 - 카테고리별 뉴스
  private getMockNewsByCategory(category: string): NewsItem[] {
    const mockData: { [key: string]: NewsItem[] } = {
      '정치': [
        {
          id: 'pol1',
          category: '정치',
          title: '국회 본회의 민생법안 우선 처리 합의',
          subtitle: '여야가 서민 생활 안정을 위한 법안들을 우선 논의하기로',
          date: '2024.08.20',
          source: '국정뉴스',
          image: 'https://via.placeholder.com/300x150/EF4444/FFFFFF?text=정치',
          summary: '국회에서 주요 민생 법안들이 우선적으로 처리될 예정입니다. 주거비 부담 완화, 육아휴직 확대, 중소기업 지원 확대 등의 법안이 포함되어 있으며, 여야는 초당적 협력을 통해 신속한 처리에 나서기로 했습니다.',
        },
        {
          id: 'pol2',
          category: '정치',
          title: '지방자치단체 내년도 예산안 확정',
          subtitle: '전국 17개 시도 총 예산 규모 450조원 돌파',
          date: '2024.08.19',
          source: '지방행정뉴스',
          image: 'https://via.placeholder.com/300x150/DC2626/FFFFFF?text=예산',
          summary: '전국 17개 광역시도의 내년도 예산 규모가 총 450조원을 넘어서며 역대 최대 규모를 기록했습니다. 지역 균형발전과 민생 안정을 위한 사업 예산이 대폭 늘어났습니다.',
        },
        {
          id: 'pol3',
          category: '정치',
          title: '디지털 정부혁신 정책 발표',
          subtitle: 'AI 기반 행정서비스 전면 도입 추진',
          date: '2024.08.18',
          source: '정책브리핑',
          image: 'https://via.placeholder.com/300x150/B91C1C/FFFFFF?text=디지털정부',
          summary: '정부가 AI를 활용한 스마트 행정서비스를 전면 도입하여 국민 편의성을 크게 개선할 계획이라고 발표했습니다.',
        },
      ],
      '경제': [
        {
          id: 'eco1',
          category: '경제',
          title: '코스피 2650선 돌파, 연내 최고치 경신',
          subtitle: '반도체·바이오 업종 강세에 외국인 매수 지속',
          date: '2024.08.20',
          source: '한국경제',
          image: 'https://via.placeholder.com/300x150/059669/FFFFFF?text=주식시장',
          summary: '코스피가 외국인 매수세와 기술주 강세에 힘입어 2650선을 돌파하며 연내 최고치를 경신했습니다. 삼성전자, SK하이닉스 등 반도체 대장주들이 상승을 견인했습니다.',
        },
        {
          id: 'eco2',
          category: '경제',
          title: '한국은행 기준금리 동결 결정',
          subtitle: '물가 안정 추세 고려, 3.50% 수준 유지',
          date: '2024.08.19',
          source: '연합뉴스',
          image: 'https://via.placeholder.com/300x150/0369A1/FFFFFF?text=금리정책',
          summary: '한국은행이 금융통화위원회에서 기준금리를 현행 3.50%로 동결하기로 결정했습니다. 최근 물가 안정 추세와 경제성장 둔화를 종합적으로 고려한 결과입니다.',
        },
        {
          id: 'eco3',
          category: '경제',
          title: '수출 증가율 2개월 연속 두 자릿수',
          subtitle: '반도체·자동차 호조로 무역수지 흑자 확대',
          date: '2024.08.18',
          source: '산업통상자원부',
          image: 'https://via.placeholder.com/300x150/16A34A/FFFFFF?text=수출증가',
          summary: '7월 수출이 전년 동월 대비 13.9% 증가하며 2개월 연속 두 자릿수 증가율을 기록했습니다.',
        },
      ],
      '문화': [
        {
          id: 'culture1',
          category: '문화',
          title: '2024 서울국제영화제 개막식 성황',
          subtitle: '40개국 200편 작품 상영, 역대 최대 규모',
          date: '2024.08.20',
          source: '문화일보',
          image: 'https://via.placeholder.com/300x150/F59E0B/FFFFFF?text=영화제',
          summary: '제29회 서울국제영화제가 성대한 개막식과 함께 막을 올렸습니다. 올해는 40개국에서 200편의 작품이 출품되어 역대 최대 규모를 자랑합니다.',
        },
        {
          id: 'culture2',
          category: '문화',
          title: 'K-팝 콘서트 해외 투어 대성공',
          subtitle: '유럽·남미 순회공연 전석 매진 행진',
          date: '2024.08.19',
          source: '케이팝스타',
          image: 'https://via.placeholder.com/300x150/EC4899/FFFFFF?text=K팝',
          summary: '국내 주요 K-팝 그룹들의 해외 순회공연이 전 세계적으로 큰 성공을 거두고 있습니다.',
        },
        {
          id: 'culture3',
          category: '문화',
          title: '전통문화 체험 프로그램 인기',
          subtitle: '한복 체험, 전통 공예 등 외국인 관광객 몰려',
          date: '2024.08.18',
          source: '관광공사',
          image: 'https://via.placeholder.com/300x150/DC2626/FFFFFF?text=전통문화',
          summary: '전통문화 체험 프로그램이 외국인 관광객들 사이에서 큰 인기를 끌고 있습니다.',
        },
      ],
      'IT/과학': [
        {
          id: 'tech1',
          category: 'IT/과학',
          title: '삼성, 3나노 GAA 공정 양산 본격화',
          subtitle: '세계 최초 차세대 반도체 기술 상용화 성공',
          date: '2024.08.20',
          source: '전자신문',
          image: 'https://via.placeholder.com/300x150/8B5CF6/FFFFFF?text=3나노',
          summary: '삼성전자가 3나노 GAA(Gate-All-Around) 공정 기술을 세계 최초로 상용화하여 차세대 반도체 시장을 선도하고 있습니다. 기존 대비 전력효율 45% 개선, 성능 23% 향상을 달성했습니다.',
        },
        {
          id: 'tech2',
          category: 'IT/과학',
          title: '국산 AI 챗봇 서비스 글로벌 진출',
          subtitle: 'ChatGPT 대항마로 동남아 시장 공략',
          date: '2024.08.19',
          source: '테크월드',
          image: 'https://via.placeholder.com/300x150/6366F1/FFFFFF?text=AI챗봇',
          summary: '국내 AI 스타트업이 개발한 한국어 특화 챗봇이 동남아시아 시장에 진출하며 주목받고 있습니다.',
        },
        {
          id: 'tech3',
          category: 'IT/과학',
          title: '6G 이동통신 표준화 작업 가속',
          subtitle: '2030년 상용화 목표로 국제 협력 강화',
          date: '2024.08.18',
          source: '통신저널',
          image: 'https://via.placeholder.com/300x150/3B82F6/FFFFFF?text=6G',
          summary: '차세대 6G 이동통신 기술 표준화 작업이 본격화되고 있습니다.',
        },
      ],
      '세계': [
        {
          id: 'world1',
          category: '세계',
          title: 'G7 정상회의에서 AI 규제 논의 합의',
          subtitle: '인공지능 안전성 확보위한 국제 협력체 출범',
          date: '2024.08.20',
          source: 'BBC 코리아',
          image: 'https://via.placeholder.com/300x150/10B981/FFFFFF?text=G7',
          summary: 'G7 국가들이 AI 기술의 안전한 발전을 위한 국제 협력체 설립에 합의했습니다. 특히 생성형 AI의 오남용 방지와 윤리적 개발 가이드라인 제정에 중점을 둘 예정입니다.',
        },
        {
          id: 'world2',
          category: '세계',
          title: '유럽 에너지 위기 완화 조짐',
          subtitle: '재생에너지 확대로 가격 안정화 기대',
          date: '2024.08.19',
          source: '로이터 통신',
          image: 'https://via.placeholder.com/300x150/059669/FFFFFF?text=에너지',
          summary: '유럽 각국의 재생에너지 확대 정책이 효과를 보이면서 에너지 가격 안정화가 기대됩니다.',
        },
        {
          id: 'world3',
          category: '세계',
          title: '아시아 경제 성장률 전망 상향',
          subtitle: 'IMF, 역내 무역 증가와 투자 확대 영향',
          date: '2024.08.18',
          source: 'AP 통신',
          image: 'https://via.placeholder.com/300x150/0EA5E9/FFFFFF?text=아시아경제',
          summary: '국제통화기금(IMF)이 아시아 지역의 올해 경제 성장률 전망을 상향 조정했습니다.',
        },
      ],
      '스포츠': [
        {
          id: 'sports1',
          category: '스포츠',
          title: '한국 축구 국가대표, 월드컵 예선 2연승',
          subtitle: '홈경기에서 3-1 대승으로 조 1위 유지',
          date: '2024.08.20',
          source: '스포츠조선',
          image: 'https://via.placeholder.com/300x150/EF4444/FFFFFF?text=축구',
          summary: '한국 축구 국가대표팀이 월드컵 아시아 지역 예선에서 연속 승리를 거두며 조 1위를 굳건히 지키고 있습니다. 특히 젊은 선수들의 활약이 돋보였습니다.',
        },
        {
          id: 'sports2',
          category: '스포츠',
          title: '프로야구 포스트시즌 진출팀 확정',
          subtitle: '5개 팀 와일드카드 경쟁 치열',
          date: '2024.08.19',
          source: 'MBC스포츠플러스',
          image: 'https://via.placeholder.com/300x150/059669/FFFFFF?text=야구',
          summary: 'KBO 리그 정규시즌이 막바지를 향해 가면서 포스트시즌 진출팀이 속속 확정되고 있습니다.',
        },
        {
          id: 'sports3',
          category: '스포츠',
          title: '김연아 아이스쇼 전국 투어 성료',
          subtitle: '은퇴 후에도 지속되는 피겨 여왕의 인기',
          date: '2024.08.18',
          source: '스포츠서울',
          image: 'https://via.placeholder.com/300x150/8B5CF6/FFFFFF?text=피겨',
          summary: '피겨스케이팅 여왕 김연아의 아이스쇼 전국 투어가 성황리에 마무리되었습니다.',
        },
      ]
    };
    
    return mockData[category] || mockData['정치'] || [];
  }
}