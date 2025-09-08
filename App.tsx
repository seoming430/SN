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
  TouchableOpacity,
  AppState,
} from 'react-native';

// 타입 및 서비스 import
import { NewsItem, ServerStatus, TabType, CategoryType } from './app/types/news';
import { NewsApiService } from './app/services/NewsApiService';
import { AuthState } from './app/types/auth';

// 컴포넌트 import
import {
  CategoryTabs,
  BottomNavigation,
  TrendingNewsCard,
  HeaderSection,
  speakText,
  stopTts,
  testTTS,
  cleanupTTS,
} from './app/components/NewsComponents';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthScreen } from './app/components/AuthComponents';
import { ProfileScreen } from './app/components/ProfileComponents';
import { NewsDetailScreen } from './app/components/NewsDetailScreen';
import { SearchScreen } from './app/components/SearchScreen';
import { NotificationSettingsScreen } from './app/components/NotificationSettingsScreen';
import { StorageService } from './app/services/StorageService';
import { notificationService } from './app/services/NotificationService';

const SummaNewsApp: React.FC = () => {
  // 상태 관리
  const [authState, setAuthState] = useState<AuthState>('login');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('정치');
  const [userCategories, setUserCategories] = useState<string[]>(['정치', '경제']);
  const [trendingNews, setTrendingNews] = useState<NewsItem[]>([]);
  const [categoryNews, setCategoryNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('unknown');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showScraps, setShowScraps] = useState(false);
  const [scrapNews, setScrapNews] = useState<NewsItem[]>([]);
  const [cameFromScraps, setCameFromScraps] = useState(false);
  const [userData, setUserData] = useState<{name: string, email: string} | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);

  // API 서비스 인스턴스
  const apiService = new NewsApiService();

  // 서버 상태 확인
  const checkServerStatus = async (): Promise<boolean> => {
    try {
      setServerStatus('connecting');
      const isOnline = await apiService.checkServerHealth();
      setServerStatus(isOnline ? 'connected' : 'error');
      return isOnline;
    } catch (error) {
      console.error('서버 상태 확인 실패:', error);
      setServerStatus('error');
      return false;
    }
  };

  // 사용자 카테고리 로드
  const loadUserCategories = async () => {
    try {
      const savedCategories = await AsyncStorage.getItem('selectedCategories');
      if (savedCategories) {
        const categories = JSON.parse(savedCategories);
        setUserCategories(categories);
        if (categories.length > 0) {
          setActiveCategory(categories[0]);
          // 첫 번째 카테고리 뉴스를 미리 로드
          await loadCategoryNews(categories[0]);
        }
      }
    } catch (error) {
      console.error('사용자 카테고리 로드 실패:', error);
    }
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
      setTrendingNews([]); // 빈 배열로 설정하여 무한로딩 방지
      setServerStatus('error');
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
      setCategoryNews([]); // 빈 배열로 설정하여 무한로딩 방지
      setServerStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // 새로고침 처리
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'trending') {
        await loadTrendingNews();
      } else if (activeTab === 'home') {
        await loadCategoryNews(activeCategory);
      }
    } catch (error) {
      console.error('새로고침 실패:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // 스크랩 상태 새로고침
  const handleBookmarkChange = () => {
    console.log('🔄 스크랩 상태 변경됨, 화면 새로고침');
    // 현재 화면의 뉴스 데이터를 다시 로드
    if (activeTab === 'trending') {
      loadTrendingNews();
    } else if (activeTab === 'home') {
      loadCategoryNews(activeCategory);
    }
  };

  // 탭 변경시 데이터 로드
  useEffect(() => {
    if (activeTab === 'trending') {
      loadTrendingNews();
    } else if (activeTab === 'home') {
      loadCategoryNews(activeCategory);
    }
  }, [activeTab, activeCategory]);

  // 초기 로딩: 홈 탭의 기본 카테고리 로딩
  useEffect(() => {
    // 앱 시작 시 사용자 카테고리를 먼저 로드하고, 없으면 기본 정치 뉴스 로드
    if (authState === 'authenticated' && userCategories.length === 0) {
      loadCategoryNews('정치');
    }
  }, [authState]);

  // 앱 시작 시 로그인 상태 확인 및 북마크 데이터 로드
    useEffect(() => {
      checkLoginStatus();
      loadScraps();
      loadUserData();
      loadNotificationHistory(); // 알림 내역 로드 추가
      checkAndScheduleNotifications();
      checkServerStatus(); // 서버 상태 확인 추가
    
    // 앱 생명주기 이벤트 리스너 설정
    const handleAppStateChange = (nextAppState: string) => {
      console.log('📱 App.tsx - 앱 상태 변경:', nextAppState);
      
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('📱 App.tsx - 앱이 백그라운드로 이동 - TTS 중지');
        stopTts().then(() => {
          console.log('✅ App.tsx - 백그라운드 이동 시 TTS 중지 완료');
        }).catch(error => {
          console.error('❌ App.tsx - 백그라운드 이동 시 TTS 중지 오류:', error);
        });
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      console.log('🧹 App.tsx - 컴포넌트 언마운트 - TTS 정리');
      subscription?.remove();
      cleanupTTS();
    };
  }, []);

  const checkAndScheduleNotifications = async () => {
    try {
      const notificationSettings = await StorageService.getNotificationSettings();
      if (notificationSettings.enabled && 
          notificationSettings.frequency === 'daily' && 
          notificationSettings.dailyNewsTime) {
        const [hour, minute] = notificationSettings.dailyNewsTime.split(':').map(Number);
        await notificationService.scheduleNewsNotification(hour, minute);
      }
    } catch (error) {
      console.error('알림 스케줄링 확인 실패:', error);
    }
  };

  const checkLoginStatus = async () => {
    try {
      const loginStatus = await AsyncStorage.getItem('isLoggedIn');
      if (loginStatus === 'true') {
        setAuthState('authenticated');
        await loadUserCategories();
      }
    } catch (error) {
      console.error('로그인 상태 확인 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadScraps = async () => {
    const scraps = await StorageService.getBookmarks();
    setScrapNews(scraps);
  };

  // 알림 내역 로드
  const loadNotificationHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('notificationHistory');
      if (history) {
        setNotificationHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('알림 내역 로드 실패:', error);
    }
  };

  // 알림 내역에 추가
  const addNotificationToHistory = async (title: string, body: string) => {
    try {
      const newNotification = {
        id: Date.now().toString(),
        title,
        body,
        timestamp: new Date().toISOString(),
        read: false
      };
      
      const updatedHistory = [newNotification, ...notificationHistory];
      setNotificationHistory(updatedHistory);
      await AsyncStorage.setItem('notificationHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('알림 내역 저장 실패:', error);
    }
  };

  // 테스트용 알림 추가 (개발용)
  const addTestNotification = async () => {
    await addNotificationToHistory(
      '오늘의 뉴스 알림',
      '새로운 뉴스가 도착했습니다. 확인해보세요!'
    );
  };

  const loadUserData = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      const userPreferences = await AsyncStorage.getItem('userPreferences');
      const userName = await AsyncStorage.getItem('userName');
      
      console.log('🔍 [App] 로드된 email:', email);
      console.log('🔍 [App] 로드된 userPreferences:', userPreferences);
      console.log('🔍 [App] 로드된 userName:', userName);
      
      let finalName = '사용자';
      
      if (userName) {
        finalName = userName;
        console.log('✅ [App] userName에서 사용자명 로드:', userName);
      } else if (userPreferences) {
        const prefs = JSON.parse(userPreferences);
        console.log('👤 [App] 파싱된 prefs:', prefs);
        console.log('👤 [App] prefs.name:', prefs.name);
        if (prefs.name) {
          finalName = prefs.name;
          console.log('✅ [App] userPreferences에서 사용자명 로드:', prefs.name);
        }
      }
      
      setUserData({
        name: finalName,
        email: email || 'user@example.com'
      });
      console.log('✅ [App] 최종 사용자 데이터 설정됨:', finalName, email);
    } catch (error) {
      console.error('사용자 데이터 로드 실패:', error);
      setUserData({
        name: '사용자',
        email: 'user@example.com'
      });
    }
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
        onStopTTS={handleTTSStop}
        isTTSPlaying={isTTSPlaying}
        newsItems={trendingNews}
        onPlayAll={handleTTSPlay}
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
            onScrapChange={loadScraps} // 스크랩 변경 시 목록 새로고침
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
        userCategories={userCategories}
        setUserCategories={setUserCategories}
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
              onScrapChange={loadScraps} // 스크랩 변경 시 목록 새로고침
            />
          ))
        )}
      </ScrollView>
    </>
  );

  // 인증 성공 핸들러
  const handleAuthSuccess = async () => {
    console.log('🎉 인증 성공 - 사용자 데이터 다시 로드');
    setAuthState('authenticated');
    await loadUserData(); // 사용자 데이터 다시 로드
    await loadUserCategories(); // 사용자 카테고리 다시 로드
    await loadScraps(); // 북마크 다시 로드
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('isLoggedIn');
      await AsyncStorage.removeItem('userEmail');
      setAuthState('login');
      setActiveTab('trending');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 뉴스 상세보기 핸들러
  const handleNewsPress = async (newsItem: NewsItem) => {
    // 읽은 기사 수 증가
    try {
      await StorageService.incrementReadArticles();
      console.log('📖 읽은 기사 수 증가됨');
    } catch (error) {
      console.error('읽은 기사 수 증가 오류:', error);
    }
    
    // 북마크 상태 확인
    const isBookmarked = await StorageService.isBookmarked(newsItem.id);
    setSelectedNews({ ...newsItem, isBookmarked });
    // 스크랩 화면에서 뉴스를 클릭한 경우 스크랩 화면 닫기
    if (showScraps) {
      setCameFromScraps(true);
      setShowScraps(false);
    } else {
      setCameFromScraps(false);
    }
  };

  // 뉴스 상세보기 뒤로가기
  const handleNewsDetailBack = () => {
    setSelectedNews(null);
    // 스크랩에서 온 경우 스크랩 화면으로 돌아가기
    if (cameFromScraps) {
      setShowScraps(true);
      setCameFromScraps(false);
    }
  };

  // TTS 재생 핸들러
  const handleTTSPlay = async () => {
    if (trendingNews.length === 0) {
      Alert.alert('알림', '재생할 뉴스가 없습니다.');
      return;
    }

    console.log('🎵 App.tsx에서 TTS 재생 시작');
    setIsTTSPlaying(true);
    
    // 인트로 메시지
    const introText = '오늘의 추천 뉴스를 전해드리겠습니다. ';
    
    // 모든 트렌딩 뉴스의 텍스트를 합쳐서 재생
    const allNewsText = trendingNews.map((item, index) => {
      const rank = item.trend_rank ? `${item.trend_rank}위 뉴스. ` : `${index + 1}번째 뉴스. `;
      return `${rank}${item.title}. ${item.subtitle || ''}. ${item.summary || ''}`;
    }).join('. 다음 뉴스. ');

    // 아웃트로 메시지
    const outroText = '. 오늘의 추천 뉴스를 마무리하겠습니다.';

    // 전체 텍스트 조합
    const fullText = introText + allNewsText + outroText;

    try {
      await speakText(fullText, false);
      console.log('🎵 App.tsx에서 TTS 재생 완료');
    } catch (error) {
      console.error('TTS 재생 오류:', error);
      Alert.alert('오류', 'TTS 재생 중 문제가 발생했습니다.');
    } finally {
      setIsTTSPlaying(false);
      console.log('🔄 App.tsx에서 TTS 상태 복원');
    }
  };

  // TTS 중지 핸들러
  const handleTTSStop = async () => {
    try {
      console.log('🛑 App.tsx에서 TTS 중지 요청');
      console.log('🛑 중지 전 isTTSPlaying:', isTTSPlaying);
      
      const stopped = await stopTts();
      console.log('🛑 stopTts() 결과:', stopped);
      
      setIsTTSPlaying(false);
      console.log('🔄 isTTSPlaying을 false로 설정');
      console.log('✅ App.tsx에서 TTS 중지 완료');
    } catch (error) {
      console.error('❌ App.tsx TTS 중지 오류:', error);
      setIsTTSPlaying(false);
      console.log('🔄 오류 발생 시에도 isTTSPlaying을 false로 설정');
    }
  };

  // 알림 내역 콘텐츠 렌더링
  const renderNotificationContent = () => (
    <ScrollView
      style={styles.newsFeed}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.newsFeedContent}
    >
      {notificationHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>받은 알림이 없습니다</Text>
          <Text style={styles.emptyMessage}>새로운 알림이 오면 여기에 표시됩니다.</Text>
          <TouchableOpacity 
            style={styles.testButton}
            onPress={addTestNotification}
          >
            <Text style={styles.testButtonText}>테스트 알림 추가</Text>
          </TouchableOpacity>
        </View>
      ) : (
        notificationHistory.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationCard,
              !notification.read && styles.unreadNotification
            ]}
            onPress={() => {
              // 알림을 읽음으로 표시
              const updatedHistory = notificationHistory.map(n => 
                n.id === notification.id ? { ...n, read: true } : n
              );
              setNotificationHistory(updatedHistory);
              AsyncStorage.setItem('notificationHistory', JSON.stringify(updatedHistory));
            }}
          >
            <View style={styles.notificationContent}>
              <Text style={[
                styles.notificationTitle,
                !notification.read && styles.unreadText
              ]}>
                {notification.title}
              </Text>
              <Text style={styles.notificationBody}>{notification.body}</Text>
              <Text style={styles.notificationTime}>
                {new Date(notification.timestamp).toLocaleString('ko-KR')}
              </Text>
            </View>
            {!notification.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  // 스크랩 탭 콘텐츠 렌더링
  const renderBookmarksContent = () => (
    <ScrollView
      style={styles.newsFeed}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.newsFeedContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadScraps} />}
    >
      {scrapNews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>⭐</Text>
          <Text style={styles.emptyTitle}>스크랩한 뉴스가 없습니다</Text>
          <Text style={styles.emptyMessage}>관심있는 뉴스를 스크랩에 추가해보세요.</Text>
        </View>
      ) : (
        scrapNews.map((item) => (
          <TrendingNewsCard 
            key={item.id} 
            item={item} 
            onPress={() => handleNewsPress(item)}
            apiService={apiService}
            showTTS={false}
            onScrapChange={loadScraps} // 스크랩 변경 시 목록 새로고침
          />
        ))
      )}
    </ScrollView>
  );

  // 메인 콘텐츠 렌더링
  const renderContent = () => {
    if (loading && !refreshing) {
      return renderLoadingScreen();
    }

    switch (activeTab) {
      case 'home':
        return renderNewsContent();
      case 'trending':
        return renderTrendingContent();
      case 'search':
        return <SearchScreen onBack={() => setActiveTab('home')} onNewsPress={handleNewsPress} />;
      case 'profile':
        return <ProfileScreen onLogout={handleLogout} onShowBookmarks={(newsItem) => {
          if (newsItem) {
            setSelectedNews(newsItem);
          } else {
            setShowScraps(true);
          }
        }} userData={userData} />;
      default:
        return renderNewsContent();
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

  // 알림 내역 화면 표시
  if (showNotifications) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowNotifications(false)}>
            <Text style={styles.headerIconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>알림 내역</Text>
          {notificationHistory.length > 0 && (
            <TouchableOpacity 
              style={styles.headerIcon}
              onPress={() => {
                Alert.alert(
                  '알림 내역 삭제',
                  '모든 알림 내역을 삭제하시겠습니까?',
                  [
                    { text: '취소', style: 'cancel' },
                    { 
                      text: '삭제', 
                      style: 'destructive',
                      onPress: async () => {
                        setNotificationHistory([]);
                        await AsyncStorage.removeItem('notificationHistory');
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.headerIconText}>🗑️</Text>
            </TouchableOpacity>
          )}
          {notificationHistory.length === 0 && (
            <View style={styles.headerIconPlaceholder} />
          )}
        </View>
        {renderNotificationContent()}
      </SafeAreaView>
    );
  }

  // 스크랩 화면 표시
  if (showScraps) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowScraps(false)}>
            <Text style={styles.headerIconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>스크랩</Text>
          <View style={styles.headerIcon} />
        </View>
        {renderBookmarksContent()}
      </SafeAreaView>
    );
  }

  // 뉴스 상세보기가 활성화된 경우
  if (selectedNews) {
    return (
      <NewsDetailScreen
        newsItem={selectedNews}
        onBack={handleNewsDetailBack}
        onScrapChange={handleBookmarkChange}
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
      
      {/* 앱 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SummaNews</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => setShowSearch(true)}
          >
            <Text style={styles.headerIconText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => setShowNotifications(true)}
          >
            <Text style={styles.headerIconText}>🔔</Text>
            {notificationHistory.filter(n => !n.read).length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationHistory.filter(n => !n.read).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerIconText: {
    fontSize: 18,
  },
  headerIconPlaceholder: {
    width: 40,
    height: 40,
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
  notificationCard: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadNotification: {
    borderColor: '#3B82F6',
    backgroundColor: '#F8FAFC',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  notificationBody: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  testButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SummaNewsApp;