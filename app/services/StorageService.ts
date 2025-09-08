// services/StorageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NewsItem } from '../types/news';

const BOOKMARKS_KEY = '@SummaNews:bookmarks';
const SEARCH_HISTORY_KEY = '@SummaNews:searchHistory';
const NOTIFICATION_SETTINGS_KEY = '@SummaNews:notifications';
const STATS_KEY = '@SummaNews:stats';

// 사용자별 키 생성 함수
const getUserKey = (baseKey: string, userId?: string): string => {
  if (userId) {
    return `${baseKey}:${userId}`;
  }
  return baseKey;
};

export interface NotificationSettings {
  enabled: boolean;
  dailyNewsTime?: string;
  categories: string[];
  frequency: 'immediate' | 'daily' | 'weekly';
}

export interface UserStats {
  readArticles: number;
  scrapArticles: number;
  lastUpdated: string;
}

export class StorageService {
  // 사용자 ID 가져오기
  static async getCurrentUserId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('userId');
    } catch (error) {
      console.error('사용자 ID 가져오기 실패:', error);
      return null;
    }
  }

  // 북마크 관련 메서드
  static async getBookmarks(): Promise<NewsItem[]> {
    try {
      const userId = await this.getCurrentUserId();
      const key = getUserKey(BOOKMARKS_KEY, userId || undefined);
      const bookmarks = await AsyncStorage.getItem(key);
      return bookmarks ? JSON.parse(bookmarks) : [];
    } catch (error) {
      console.error('북마크 불러오기 실패:', error);
      return [];
    }
  }

  static async addBookmark(newsItem: NewsItem): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      const key = getUserKey(BOOKMARKS_KEY, userId || undefined);
      const bookmarks = await this.getBookmarks();
      const exists = bookmarks.some(item => item.id === newsItem.id);
      
      if (!exists) {
        bookmarks.unshift({ ...newsItem, isBookmarked: true });
        await AsyncStorage.setItem(key, JSON.stringify(bookmarks));
        return true;
      }
      return false;
    } catch (error) {
      console.error('북마크 추가 실패:', error);
      return false;
    }
  }

  static async removeBookmark(newsId: string): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      const key = getUserKey(BOOKMARKS_KEY, userId || undefined);
      const bookmarks = await this.getBookmarks();
      const filtered = bookmarks.filter(item => item.id !== newsId);
      await AsyncStorage.setItem(key, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('북마크 제거 실패:', error);
      return false;
    }
  }

  static async isBookmarked(newsId: string): Promise<boolean> {
    try {
      const bookmarks = await this.getBookmarks();
      return bookmarks.some(item => item.id === newsId);
    } catch (error) {
      console.error('북마크 확인 실패:', error);
      return false;
    }
  }

  // 검색 기록 관련 메서드
  static async getSearchHistory(): Promise<string[]> {
    try {
      const userId = await this.getCurrentUserId();
      const key = getUserKey(SEARCH_HISTORY_KEY, userId || undefined);
      const history = await AsyncStorage.getItem(key);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('검색 기록 불러오기 실패:', error);
      return [];
    }
  }

  static async addSearchHistory(query: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      const key = getUserKey(SEARCH_HISTORY_KEY, userId || undefined);
      let history = await this.getSearchHistory();
      history = history.filter(item => item !== query);
      history.unshift(query);
      if (history.length > 10) history = history.slice(0, 10);
      await AsyncStorage.setItem(key, JSON.stringify(history));
    } catch (error) {
      console.error('검색 기록 추가 실패:', error);
    }
  }

  static async clearSearchHistory(): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      const key = getUserKey(SEARCH_HISTORY_KEY, userId || undefined);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('검색 기록 삭제 실패:', error);
    }
  }

  // 알림 설정 관련 메서드
  static async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      return settings ? JSON.parse(settings) : {
        enabled: false,
        categories: [],
        frequency: 'daily'
      };
    } catch (error) {
      console.error('알림 설정 불러오기 실패:', error);
      return {
        enabled: false,
        categories: [],
        frequency: 'daily'
      };
    }
  }

  static async saveNotificationSettings(settings: NotificationSettings): Promise<boolean> {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('알림 설정 저장 실패:', error);
      return false;
    }
  }

  // 통계 관련 함수들
  static async getUserStats(): Promise<UserStats> {
    try {
      const userId = await this.getCurrentUserId();
      const key = getUserKey(STATS_KEY, userId || undefined);
      const stats = await AsyncStorage.getItem(key);
      
      if (stats) {
        return JSON.parse(stats);
      }
      
      // 기본 통계 반환
      return {
        readArticles: 0,
        scrapArticles: 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('사용자 통계 가져오기 실패:', error);
      return {
        readArticles: 0,
        scrapArticles: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  static async saveUserStats(stats: UserStats): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      const key = getUserKey(STATS_KEY, userId || undefined);
      await AsyncStorage.setItem(key, JSON.stringify(stats));
      return true;
    } catch (error) {
      console.error('사용자 통계 저장 실패:', error);
      return false;
    }
  }

  static async incrementReadArticles(): Promise<boolean> {
    try {
      const stats = await this.getUserStats();
      stats.readArticles += 1;
      stats.lastUpdated = new Date().toISOString();
      return await this.saveUserStats(stats);
    } catch (error) {
      console.error('읽은 기사 수 증가 실패:', error);
      return false;
    }
  }

  static async updateScrapCount(): Promise<boolean> {
    try {
      const bookmarks = await this.getBookmarks();
      const stats = await this.getUserStats();
      stats.scrapArticles = bookmarks.length;
      stats.lastUpdated = new Date().toISOString();
      return await this.saveUserStats(stats);
    } catch (error) {
      console.error('스크랩 수 업데이트 실패:', error);
      return false;
    }
  }

  // 사용자 데이터 완전 초기화 (회원가입 시 사용)
  static async clearUserData(): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      console.log('🧹 사용자 데이터 초기화 시작, userId:', userId);
      
      // 사용자별 데이터 키들
      const userKeys = [
        getUserKey(BOOKMARKS_KEY, userId || undefined),
        getUserKey(SEARCH_HISTORY_KEY, userId || undefined),
        getUserKey(NOTIFICATION_SETTINGS_KEY, userId || undefined),
        getUserKey(STATS_KEY, userId || undefined),
      ];
      
      // 모든 사용자별 데이터 제거
      for (const key of userKeys) {
        await AsyncStorage.removeItem(key);
        console.log('🗑️ 제거된 키:', key);
      }
      
      // 전역 데이터도 제거
      await AsyncStorage.removeItem('userPreferences');
      await AsyncStorage.removeItem('userName');
      await AsyncStorage.removeItem('userEmail');
      await AsyncStorage.removeItem('isLoggedIn');
      await AsyncStorage.removeItem('userId');
      
      console.log('✅ 사용자 데이터 초기화 완료');
      return true;
    } catch (error) {
      console.error('사용자 데이터 초기화 실패:', error);
      return false;
    }
  }
}