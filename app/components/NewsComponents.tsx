// components/NewsComponents.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { NewsItem, ServerStatus, TabType, CategoryType } from '../types/news';
import { NewsApiService } from '../services/NewsApiService';

// Props 인터페이스들
interface TabButtonProps {
  title: string;
  isActive: boolean;
  onPress: () => void;
}

interface TrendingNewsCardProps {
  item: NewsItem;
  onPress: () => void;
  apiService: NewsApiService;
}

interface CategoryTabsProps {
  activeCategory: CategoryType;
  setActiveCategory: (category: CategoryType) => void;
}

interface BottomNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

interface ServerStatusIndicatorProps {
  status: ServerStatus;
}

interface HeaderSectionProps {
  apiService: NewsApiService;
  serverStatus: ServerStatus;
}

// 탭 버튼 컴포넌트
export const TabButton: React.FC<TabButtonProps> = ({ title, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.tabButton, isActive && styles.activeTabButton]}
    onPress={onPress}
  >
    <Text style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}>
      {title}
    </Text>
  </TouchableOpacity>
);

// 트렌딩 뉴스 카드 컴포넌트
export const TrendingNewsCard: React.FC<TrendingNewsCardProps> = ({ item, onPress, apiService }) => (
  <TouchableOpacity style={styles.trendingNewsCard} activeOpacity={0.8} onPress={onPress}>
    <View style={styles.trendingHeader}>
      <View style={styles.categoryTag}>
        <Text style={styles.categoryText}>{item.category}</Text>
      </View>
      {item.trend_rank && (
        <View style={styles.trendRankContainer}>
          <Text style={styles.trendRankText}>#{item.trend_rank}</Text>
        </View>
      )}
    </View>
    
    <Image source={{ uri: item.image }} style={styles.newsImage} />
    
    <View style={styles.newsContent}>
      <Text style={styles.newsTitle}>{item.title}</Text>
      <Text style={styles.newsSubtitle}>{item.subtitle}</Text>
      
      <Text style={styles.newsSummary} numberOfLines={3}>
        {item.summary || '요약 내용이 없습니다.'}
      </Text>
      
      <View style={styles.newsFooter}>
        <View style={styles.newsInfo}>
          <Text style={styles.newsDate}>{item.date}</Text>
          <Text style={styles.newsSource}>• {item.source}</Text>
        </View>
        {item.originalUrl && (
          <TouchableOpacity 
            style={styles.summarizeButton}
            onPress={(e) => {
              e.stopPropagation();
              apiService.testSummarize(item.originalUrl!);
            }}
          >
            <Text style={styles.summarizeButtonText}>🤖 요약</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

// 카테고리 탭 컴포넌트
export const CategoryTabs: React.FC<CategoryTabsProps> = ({ activeCategory, setActiveCategory }) => {
  const categories: CategoryType[] = ['전체', '문화', '경제', 'IT/과학', '세계', '스포츠'];

  return (
    <View style={styles.tabContainer}>
      <View style={styles.addButton}>
        <Text style={styles.addButtonText}>+</Text>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabScrollView}
        contentContainerStyle={styles.tabScrollContent}
      >
        {categories.map((category) => (
          <TabButton 
            key={category}
            title={category} 
            isActive={activeCategory === category} 
            onPress={() => setActiveCategory(category)} 
          />
        ))}
      </ScrollView>
    </View>
  );
};

// 하단 네비게이션 컴포넌트
export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, setActiveTab }) => (
  <View style={styles.bottomNav}>
    <TouchableOpacity 
      style={styles.navItem}
      onPress={() => setActiveTab('오늘의 추천')}
    >
      <Text style={[styles.navIcon, activeTab === '오늘의 추천' && styles.activeNavIcon]}>⭐</Text>
      <Text style={[styles.navText, activeTab === '오늘의 추천' && styles.activeNavText]}>오늘의 추천</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={styles.navItem}
      onPress={() => setActiveTab('뉴스')}
    >
      <Text style={[styles.navIcon, activeTab === '뉴스' && styles.activeNavIcon]}>📰</Text>
      <Text style={[styles.navText, activeTab === '뉴스' && styles.activeNavText]}>뉴스</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={styles.navItem}
      onPress={() => setActiveTab('프로필')}
    >
      <Text style={[styles.navIcon, activeTab === '프로필' && styles.activeNavIcon]}>👤</Text>
      <Text style={[styles.navText, activeTab === '프로필' && styles.activeNavText]}>프로필</Text>
    </TouchableOpacity>
  </View>
);

// 서버 상태 표시 컴포넌트
export const ServerStatusIndicator: React.FC<ServerStatusIndicatorProps> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online': return '#10B981';
      case 'offline': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online': return '🟢 서버 연결됨';
      case 'offline': return '🔴 서버 오프라인';
      default: return '⚪ 상태 확인 중';
    }
  };

  return (
    <View style={[styles.serverStatus, { backgroundColor: getStatusColor() + '20' }]}>
      <Text style={[styles.serverStatusText, { color: getStatusColor() }]}>
        {getStatusText()}
      </Text>
    </View>
  );
};

// 헤더 섹션 컴포넌트
export const HeaderSection: React.FC<HeaderSectionProps> = ({ apiService, serverStatus }) => (
  <View style={styles.trendingHeaderSection}>
    <Text style={styles.trendingTitle}>🔥 오늘의 트렌딩 뉴스</Text>
    <Text style={styles.trendingSubtitle}>
      가장 많이 읽히고 있는 뉴스를 AI가 요약해드립니다
    </Text>
    
    <ServerStatusIndicator status={serverStatus} />
    
    <View style={styles.buttonRow}>
      <TouchableOpacity 
        style={styles.testApiButton}
        onPress={() => apiService.testSummarize('https://example.com/test-news')}
      >
        <Text style={styles.testApiButtonText}>🧪 API 테스트</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.debugButton}
        onPress={() => Alert.alert(
          '디버그 정보', 
          `서버 URL: ${apiService.getBaseUrlInfo()}\n플랫폼: ${Platform.OS}\n서버 상태: ${serverStatus}`,
          [{ text: '확인' }]
        )}
      >
        <Text style={styles.debugButtonText}>🔧 디버그</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// 앱 헤더 컴포넌트
export const AppHeader: React.FC = () => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>SummaNews</Text>
    <View style={styles.headerIcons}>
      <TouchableOpacity style={styles.headerIcon}>
        <Text style={styles.iconText}>🔍</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerIcon}>
        <Text style={styles.iconText}>🔔</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// 스타일
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A4DFF',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  addButtonText: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '500',
  },
  tabScrollView: {
    flex: 1,
  },
  tabScrollContent: {
    paddingRight: 20,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  activeTabButton: {
    backgroundColor: '#4A4DFF',
    borderColor: '#4A4DFF',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  trendingHeaderSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  trendingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  trendingSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
    marginBottom: 12,
  },
  serverStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  serverStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  testApiButton: {
    backgroundColor: '#4A4DFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  testApiButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  debugButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  trendingNewsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  trendingHeader: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  categoryTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
  },
  trendRankContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
  },
  trendRankText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  newsImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#F8F9FA',
  },
  newsContent: {
    padding: 16,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  newsSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 12,
  },
  newsSummary: {
    fontSize: 13,
    color: '#495057',
    lineHeight: 18,
    marginBottom: 12,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  newsDate: {
    fontSize: 12,
    color: '#ADB5BD',
  },
  newsSource: {
    fontSize: 12,
    color: '#ADB5BD',
    marginLeft: 4,
  },
  summarizeButton: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  summarizeButtonText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '600',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingBottom: 34,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  activeNavIcon: {
    color: '#4A4DFF',
  },
  navText: {
    fontSize: 10,
    color: '#6C757D',
    fontWeight: '500',
  },
  activeNavText: {
    color: '#4A4DFF',
    fontWeight: 'bold',
  },
});