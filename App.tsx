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

// 컴포넌트 import
import {
  AppHeader,
  CategoryTabs,
  BottomNavigation,
  TrendingNewsCard,
  HeaderSection,
} from './app/components/NewsComponents';

const SummaNewsApp: React.FC = () => {
  // 상태 관리
  const [activeTab, setActiveTab] = useState<TabType>('오늘의 추천');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('전체');
  const [trendingNews, setTrendingNews] = useState<NewsItem[]>([]);
  const [categoryNews, setCategoryNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('unknown');

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

  // 로딩 화면 렌더링
  const renderLoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4A4DFF" />
      <Text style={styles.loadingText}>뉴스를 불러오는 중...</Text>
    </View>
  );

  // 오늘의 추천 탭 콘텐츠 렌더링
  const renderTrendingContent = () => (
    <ScrollView
      style={styles.newsFeed}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.newsFeedContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <HeaderSection apiService={apiService} serverStatus={serverStatus} />
      
      {trendingNews.map((item) => (
        <TrendingNewsCard 
          key={item.id} 
          item={item} 
          onPress={() => {
            // 뉴스 상세 페이지로 이동하는 로직 추가 가능
            console.log('뉴스 클릭:', item.title);
          }}
          apiService={apiService}
        />
      ))}
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
        {categoryNews.map((item) => (
          <TrendingNewsCard 
            key={item.id} 
            item={item} 
            onPress={() => {
              console.log('뉴스 클릭:', item.title);
            }}
            apiService={apiService}
          />
        ))}
      </ScrollView>
    </>
  );

  // 프로필 탭 콘텐츠 렌더링
  const renderProfileContent = () => (
    <View style={styles.profileContainer}>
      <Text style={styles.profileTitle}>👤 프로필</Text>
      <Text style={styles.profileSubtitle}>사용자 프로필 화면입니다.</Text>
      <Text style={styles.comingSoon}>곧 업데이트 예정입니다! 🚀</Text>
    </View>
  );

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
        return renderProfileContent();
      default:
        return renderTrendingContent();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <AppHeader />
      
      {renderContent()}
      
      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
});

export default SummaNewsApp;