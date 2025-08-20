// App.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Text,
} from 'react-native';

// 타입 및 서비스 import
import { NewsItem, ServerStatus, TabType, CategoryType } from './app/types/news';
import { NewsApiService } from './app/services/NewsApiService';
import { AuthState } from './app/types/auth';

// 컴포넌트 import
import {
  AppHeader,
  CategoryTabs,
  BottomNavigation,
  TrendingNewsCard,
  HeaderSection,
  speakText,
  stopTts,
} from './app/components/NewsComponents';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthScreen } from './app/components/AuthComponents';
import { ProfileScreen } from './app/components/ProfileComponents';
import { NewsDetailScreen } from './app/components/NewsDetailScreen';
import { SearchScreen } from './app/components/SearchScreen';
import { NotificationSettingsScreen } from './app/components/NotificationSettingsScreen';
import { StorageService } from './app/services/StorageService';

const SummaNewsApp: React.FC = () => {
  // 상태 관리
  const [authState, setAuthState] = useState<AuthState>('login');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('오늘의 추천');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('정치');
  const [trendingNews, setTrendingNews] = useState<NewsItem[]>([]);
  const [categoryNews, setCategoryNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('unknown');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [bookmarkedNews, setBookmarkedNews] = useState<NewsItem[]>([]);

  // API 서비스 인스턴스
  const apiService = new NewsApiService();

  // 서버 상태 확인
  const checkServerStatus = async (): Promise<boolean> => {
    const isOnline = await apiService.checkServerHealth();
    setServerStatus(isOnline ? 'online' : 'offline');
    return isOnline;
  };

  // 트렌딩 뉴스 로드
  const loadTrendingNews = async () => {
    try {
      setLoading(true);
      const trending = await apiService.getTrendingNews();
      setTrendingNews(trending);
      await checkServerStatus();
    } catch (error) {
      console.error('트렌딩 뉴스 로드 실패:', error);
      Alert.alert('오류', '트렌딩 뉴스를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리별 뉴스 로드
  const loadCategoryNews = async (category: CategoryType) => {
    try {
      setLoading(true);
      const news = await apiService.getNewsByCategory(category);
      setCategoryNews(news);
      await checkServerStatus();
    } catch (error) {
      console.error('카테고리 뉴스 로드 실패:', error);
      Alert.alert('오류', '뉴스를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 새로고침 처리
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === '오늘의 추천') {
        await loadTrendingNews();
      } else {
        await loadCategoryNews(activeCategory);
      }
    } catch (error) {
      console.error('새로고침 실패:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // 탭 변경시 데이터 로드
  useEffect(() => {
    if (activeTab === '오늘의 추천') {
      loadTrendingNews();
    } else if (activeTab === '뉴스') {
      loadCategoryNews(activeCategory);
    }
  }, [activeTab, activeCategory]);

  // 초기 로딩: 뉴스 탭의 기본 카테고리 로딩
  useEffect(() => {
    if (activeTab === '뉴스') {
      loadCategoryNews('정치'); // 기본으로 정치 뉴스 로드
    }
  }, []);

  // 앱 시작 시 로그인 상태 확인 및 북마크 데이터 로드
  useEffect(() => {
    checkLoginStatus();
    loadBookmarks();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const loginStatus = await AsyncStorage.getItem('isLoggedIn');
      if (loginStatus === 'true') {
        setAuthState('authenticated');
      }
    } catch (error) {
      console.error('로그인 상태 확인 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookmarks = async () => {
    const bookmarks = await StorageService.getBookmarks();
    setBookmarkedNews(bookmarks);
  };

  // 로딩 화면 렌더링
  const renderLoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4A4DFF" />
      <Text style={styles.loadingText}>뉴스를 불러오는 중...</Text>
    </View>
  );

  // 간단한 TTS 정지 기능
  const handleStopAllTTS = async () => {
    try {
      await stopTts();
      console.log('TTS 중지됨');
    } catch (error) {
      console.error('TTS 정지 오류:', error);
    }
  };

  // 오늘의 추천 탭 콘텐츠 렌더링
  const renderTrendingContent = () => (
    <ScrollView
      style={styles.newsFeed}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.newsFeedContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <HeaderSection 
        apiService={apiService} 
        serverStatus={serverStatus}
        onStopTTS={handleStopAllTTS}
        isTTSPlaying={isTTSPlaying}
        newsItems={trendingNews}
        onPlayAll={() => setIsTTSPlaying(true)}
      />
      
      {trendingNews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📰</Text>
          <Text style={styles.emptyTitle}>뉴스를 불러올 수 없습니다</Text>
          <Text style={styles.emptyMessage}>서버에 연결할 수 없습니다.{"\n"}잠시 후 다시 시도해주세요.</Text>
        </View>
      ) : (
        trendingNews.map((item) => (
          <TrendingNewsCard 
            key={item.id} 
            item={item} 
            onPress={() => handleNewsPress(item)}
            apiService={apiService}
            showTTS={false} // TTS 기능 비활성화 (전체 재생만 사용)
          />
        ))
      )}
    </ScrollView>
  );

  // 뉴스 탭 콘텐츠 렌더링
  const renderNewsContent = () => (
    <>
      <CategoryTabs 
        activeCategory={activeCategory} 
        setActiveCategory={setActiveCategory} 
      />
      
      <ScrollView
        style={styles.newsFeed}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.newsFeedContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {categoryNews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📰</Text>
            <Text style={styles.emptyTitle}>{activeCategory} 뉴스를 불러올 수 없습니다</Text>
            <Text style={styles.emptyMessage}>서버에 연결할 수 없습니다.{"\n"}잠시 후 다시 시도해주세요.</Text>
          </View>
        ) : (
          categoryNews.map((item) => (
            <TrendingNewsCard 
              key={item.id} 
              item={item} 
              onPress={() => handleNewsPress(item)}
              apiService={apiService}
              showTTS={false} // 일반 뉴스 탭에서는 TTS 기능 비활성화
            />
          ))
        )}
      </ScrollView>
    </>
  );

  // 인증 성공 핸들러
  const handleAuthSuccess = () => {
    setAuthState('authenticated');
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('isLoggedIn');
      await AsyncStorage.removeItem('userEmail');
      setAuthState('login');
      setActiveTab('오늘의 추천');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 뉴스 상세보기 핸들러
  const handleNewsPress = async (newsItem: NewsItem) => {
    // 북마크 상태 확인
    const isBookmarked = await StorageService.isBookmarked(newsItem.id);
    setSelectedNews({ ...newsItem, isBookmarked });
  };

  // 뉴스 상세보기 뒤로가기
  const handleNewsDetailBack = () => {
    setSelectedNews(null);
  };

  // TTS 재생 핸들러
  const handleTTSPlay = (text: string) => {
    setIsTTSPlaying(true);
    // TTS 로직은 NewsComponents.tsx의 speakText 함수 사용
    console.log('TTS 재생:', text);
  };

  // TTS 중지 핸들러
  const handleTTSStop = () => {
    setIsTTSPlaying(false);
    // TTS 중지 로직은 NewsComponents.tsx의 stopTts 함수 사용
    console.log('TTS 중지');
  };

  // 메인 콘텐츠 렌더링
  const renderContent = () => {
    if (loading && !refreshing) {
      return renderLoadingScreen();
    }

    switch (activeTab) {
      case '오늘의 추천':
        return renderTrendingContent();
      case '뉴스':
        return renderNewsContent();
      case '프로필':
        return <ProfileScreen onLogout={handleLogout} />;
      default:
        return renderTrendingContent();
    }
  };

  // 검색 화면 표시
  if (showSearch) {
    return (
      <SearchScreen
        onBack={() => setShowSearch(false)}
        onNewsPress={handleNewsPress}
      />
    );
  }

  // 알림 설정 화면 표시
  if (showNotificationSettings) {
    return (
      <NotificationSettingsScreen
        onBack={() => setShowNotificationSettings(false)}
      />
    );
  }

  // 뉴스 상세보기가 활성화된 경우
  if (selectedNews) {
    return (
      <NewsDetailScreen
        newsItem={selectedNews}
        onBack={handleNewsDetailBack}
      />
    );
  }

  // 로딩 중이거나 인증되지 않은 경우
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A4DFF" />
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  if (authState !== 'authenticated') {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <AppHeader 
        onSearchPress={() => setShowSearch(true)}
        onNotificationPress={() => setShowNotificationSettings(true)}
      />
      
      {renderContent()}
      
      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6C757D',
  },
  newsFeed: {
    flex: 1,
  },
  newsFeedContent: {
    padding: 16,
    paddingBottom: 120, // 하단 네비게이션 공간 확보
  },
  profileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  profileSubtitle: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 20,
    textAlign: 'center',
  },
  comingSoon: {
    fontSize: 14,
    color: '#4A4DFF',
    fontWeight: '600',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SummaNewsApp;