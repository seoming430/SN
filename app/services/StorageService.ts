// services/StorageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NewsItem } from '../types/news';

const BOOKMARKS_KEY = '@SummaNews:bookmarks';
const SEARCH_HISTORY_KEY = '@SummaNews:searchHistory';
const NOTIFICATION_SETTINGS_KEY = '@SummaNews:notifications';

export interface NotificationSettings {
  enabled: boolean;
  dailyNewsTime?: string;
  categories: string[];
  frequency: 'immediate' | 'daily' | 'weekly';
}

export class StorageService {
  // 북마크 관련 메서드
  static async getBookmarks(): Promise<NewsItem[]> {
    try {
      const bookmarks = await AsyncStorage.getItem(BOOKMARKS_KEY);
      return bookmarks ? JSON.parse(bookmarks) : [];
    } catch (error) {
      console.error('북마크 불러오기 실패:', error);
      return [];
    }
  }

  static async addBookmark(newsItem: NewsItem): Promise<boolean> {
    try {
      const bookmarks = await this.getBookmarks();
      const exists = bookmarks.some(item => item.id === newsItem.id);
      
      if (!exists) {
        bookmarks.unshift({ ...newsItem, isBookmarked: true });
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
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
      const bookmarks = await this.getBookmarks();
      const filtered = bookmarks.filter(item => item.id !== newsId);
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
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
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('검색 기록 불러오기 실패:', error);
      return [];
    }
  }

  static async addSearchHistory(query: string): Promise<void> {
    try {
      let history = await this.getSearchHistory();
      history = history.filter(item => item !== query);
      history.unshift(query);
      if (history.length > 10) history = history.slice(0, 10);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('검색 기록 추가 실패:', error);
    }
  }

  static async clearSearchHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
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
}