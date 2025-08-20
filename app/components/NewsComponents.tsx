// components/NewsComponents.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
// TTS 기능을 위한 안전한 모듈 import
let Tts: any = null;
let ttsInitialized = false;

try {
  const ttsModule = require('react-native-tts');
  Tts = ttsModule.default || ttsModule;
  console.log('✅ TTS 모듈 로드 성공');
} catch (error) {
  console.log('⚠️ TTS 모듈 로드 실패:', error);
  Tts = null;
}
import { LinearGradient } from 'react-native-linear-gradient';
import { NewsItem, ServerStatus, TabType, CategoryType } from '../types/news';
import { NewsApiService } from '../services/NewsApiService';

const { width } = Dimensions.get('window');

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
  showTTS?: boolean; // TTS 기능 표시 여부
  onTTSStart?: () => void; // TTS 시작 콜백
  onTTSStop?: () => void; // TTS 중지 콜백
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
  onStopTTS?: () => void;
  isTTSPlaying?: boolean;
  newsItems?: NewsItem[];
  onPlayAll?: () => void;
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

// TTS 기능을 위한 함수들
const initializeTts = async () => {
  if (!Tts) {
    console.log('❌ TTS 모듈이 로드되지 않음');
    return false;
  }
  
  try {
    console.log('🔧 TTS 초기화 시작...');
    
    // 기본 설정
    await Tts.setDefaultLanguage('ko-KR');
    await Tts.setDefaultRate(0.5);
    await Tts.setDefaultPitch(1.0);
    
    // 이벤트 리스너 추가
    Tts.addEventListener('tts-start', (event: any) => {
      console.log('🔊 TTS 시작:', event);
    });
    
    Tts.addEventListener('tts-finish', (event: any) => {
      console.log('✅ TTS 완료:', event);
    });
    
    Tts.addEventListener('tts-cancel', (event: any) => {
      console.log('⏹️ TTS 취소:', event);
    });
    
    ttsInitialized = true;
    console.log('✅ TTS 초기화 완료');
    return true;
  } catch (error) {
    console.error('❌ TTS 초기화 실패:', error);
    return false;
  }
};

// TTS 초기화 실행
initializeTts();

export const speakText = async (text: string, showAlert: boolean = true) => {
  console.log('🎤 TTS 요청:', text.substring(0, 50) + '...');
  
  if (!Tts) {
    Alert.alert(
      'TTS 설정 필요',
      '음성 기능을 사용하려면:\n\n1. 앱을 완전히 종료 후 재시작\n2. 안드로이드: 설정 > 접근성 > TTS 엔진 활성화\n3. 디바이스 볼륨 확인\n4. 앱 권한에서 마이크 권한 허용'
    );
    return false;
  }
  
  try {
    // TTS가 초기화되지 않았다면 초기화 시도
    if (!ttsInitialized) {
      console.log('🔄 TTS 재초기화 시도...');
      const initialized = await initializeTts();
      if (!initialized) {
        throw new Error('TTS 초기화 실패');
      }
    }
    
    console.log('🔊 TTS 재생 시작');
    
    // 기존 재생 중인 TTS 중지
    await Tts.stop();
    
    // 텍스트 정리
    let cleanText = text
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // 텍스트 길이 제한을 늘림 (전체 재생을 위해)
    if (cleanText.length > 4000) {
      cleanText = cleanText.substring(0, 4000) + '... 요약 완료';
    }
    
    console.log('🎵 재생할 텍스트:', cleanText.substring(0, 100));
    
    // TTS 재생
    await Tts.speak(cleanText);
    
    if (showAlert) {
      Alert.alert(
        '🔊 음성 재생 중',
        '재생 중입니다. 중지하려면 정지 버튼을 누르세요.',
        [{ text: '확인' }]
      );
    }
    
    return true;
  } catch (error) {
    console.error('❌ TTS 에러:', error);
    Alert.alert(
      'TTS 오류',
      '음성 재생에 실패했습니다.\n\n해결방법:\n1. 앱 재시작\n2. 안드로이드 TTS 엔진 확인\n3. 볼륨 설정 확인\n\n오류: ' + String(error)
    );
    return false;
  }
};

export const stopTts = async () => {
  try {
    if (Tts) {
      await Tts.stop();
      console.log('⏹️ TTS 중지됨');
      return true;
    }
    return false;
  } catch (error) {
    console.error('TTS 중지 에러:', error);
    return false;
  }
};

// 개선된 뉴스 카드 컴포넌트 (기존 디자인 + 새 기능)
export const EnhancedNewsCard: React.FC<TrendingNewsCardProps> = ({ item, onPress, apiService, showTTS = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const handleTTS = async () => {
    if (isSpeaking) {
      await stopTts();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      try {
        const textToSpeak = `${item.title}. ${item.summary || item.subtitle}`;
        await speakText(textToSpeak);
      } catch (error) {
        console.error('TTS 실행 중 오류:', error);
      } finally {
        setIsSpeaking(false);
      }
    }
  };
  
  const handleOpenLink = async () => {
    if (item.originalUrl) {
      try {
        await Linking.openURL(item.originalUrl);
      } catch (error) {
        Alert.alert('오류', '링크를 열 수 없습니다.');
      }
    }
  };
  
  return (
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
        
        <TouchableOpacity 
          style={[styles.testApiButton, { marginTop: 8, marginBottom: 8 }]}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text style={styles.testApiButtonText}>
            {isExpanded ? '📄 간략히' : '📝 AI 요약보기'}
          </Text>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.summaryExpandedContainer}>
            <Text style={styles.newsSummary}>
              {item.summary || '요약 내용이 없습니다.'}
            </Text>
            <View style={styles.buttonRow}>
              {showTTS && (
                <TouchableOpacity 
                  style={[styles.ttsActionButton, isSpeaking && styles.ttsActiveButton]} 
                  onPress={handleTTS}
                >
                  <Text style={styles.ttsActionButtonText}>
                    {isSpeaking ? '⏹️ 중지' : '🔊 듣기'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.linkActionButton, showTTS ? {} : { flex: 1 }]} onPress={handleOpenLink}>
                <Text style={styles.linkActionButtonText}>📰 원문</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <View style={styles.newsFooter}>
          <View style={styles.newsInfo}>
            <Text style={styles.newsDate}>{item.date}</Text>
            <Text style={styles.newsSource}>• {item.source}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// 현대적인 뉴스 카드 컴포넌트
export const TrendingNewsCard: React.FC<TrendingNewsCardProps> = ({ item, onPress, apiService, showTTS = true, onTTSStart, onTTSStop }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(item.isBookmarked || false);

  const handleTTS = async (e: any) => {
    e.stopPropagation();
    if (isSpeaking) {
      await stopTts();
      setIsSpeaking(false);
      onTTSStop && onTTSStop();
    } else {
      setIsSpeaking(true);
      onTTSStart && onTTSStart();
      try {
        const textToSpeak = item.trend_rank ? 
          `트렌딩 뉴스 ${item.trend_rank}등. ${item.title}. ${item.summary || item.subtitle}` :
          `${item.title}. ${item.summary || item.subtitle}`;
        await speakText(textToSpeak);
      } catch (error) {
        console.error('TTS 실행 중 오류:', error);
      } finally {
        setIsSpeaking(false);
        onTTSStop && onTTSStop();
      }
    }
  };

  const handleBookmark = (e: any) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    Alert.alert(
      isBookmarked ? '즐겨찾기 해제' : '즐겨찾기 추가',
      isBookmarked ? '즐겨찾기에서 제거되었습니다.' : '즐겨찾기에 추가되었습니다.'
    );
  };

  return (
    <TouchableOpacity style={styles.modernNewsCard} activeOpacity={0.9} onPress={onPress}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.cardGradient}
      >
        {/* 상단 메타 정보 */}
        <View style={styles.cardHeader}>
          <View style={styles.modernCategoryTag}>
            <Text style={styles.modernCategoryText}>{item.category}</Text>
          </View>
          <TouchableOpacity onPress={handleBookmark} style={styles.bookmarkButton}>
            <Text style={[styles.bookmarkIcon, { color: isBookmarked ? '#F59E0B' : '#9CA3AF' }]}>
              {isBookmarked ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 이미지 */}
        <View style={styles.modernImageContainer}>
          <Image source={{ uri: item.image }} style={styles.modernNewsImage} />
          {item.trend_rank && (
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.modernTrendBadge}
            >
              <Text style={styles.modernTrendText}>#{item.trend_rank}</Text>
            </LinearGradient>
          )}
        </View>

        {/* 컨텐츠 */}
        <View style={styles.modernNewsContent}>
          <Text style={styles.modernNewsTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.modernNewsSubtitle} numberOfLines={2}>{item.subtitle}</Text>
          
          <Text style={styles.modernNewsSummary} numberOfLines={3}>
            {item.summary || '요약 내용이 없습니다.'}
          </Text>
          
          {/* TTS 버튼 제거됨 */}
          
          {/* 하단 메타 정보 */}
          <View style={styles.modernNewsFooter}>
            <Text style={styles.modernNewsDate}>{item.date}</Text>
            <Text style={styles.modernNewsSource}>• {item.source}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// 카테고리 탭 컴포넌트
export const CategoryTabs: React.FC<CategoryTabsProps> = ({ activeCategory, setActiveCategory }) => {
  const categories: CategoryType[] = ['정치', '경제', 'IT/과학', '문화', '세계', '스포츠'];

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

// 헤더 섹션 컴포넌트 (전체 재생 버튼 추가)
export const HeaderSection: React.FC<HeaderSectionProps> = ({ apiService, serverStatus, onStopTTS, isTTSPlaying, newsItems, onPlayAll }) => {
  const [isPlayingAll, setIsPlayingAll] = useState(false);

  const handlePlayAll = async () => {
    console.log('전체 재생 버튼 클릭됨');
    console.log('현재 뉴스 개수:', newsItems?.length);
    
    if (isPlayingAll) {
      console.log('재생 중지 시도');
      await stopTts();
      setIsPlayingAll(false);
      onStopTTS && onStopTTS();
    } else {
      if (!newsItems || newsItems.length === 0) {
        Alert.alert('알림', '재생할 뉴스가 없습니다.');
        return;
      }
      
      setIsPlayingAll(true);
      onPlayAll && onPlayAll();
      
      try {
        let allText = `오늘의 추천 뉴스 전체 재생을 시작합니다. `;
        
        for (let i = 0; i < newsItems.length; i++) {
          const item = newsItems[i];
          allText += `${i + 1}번째 뉴스. ${item.title}. ${item.summary || item.subtitle}. `;
        }
        
        allText += `총 ${newsItems.length}개의 뉴스 재생이 완료되었습니다.`;
        
        console.log('재생할 텍스트 길이:', allText.length);
        const result = await speakText(allText, true); // Alert 표시하도록 변경
        console.log('TTS 재생 결과:', result);
      } catch (error) {
        console.error('전체 재생 오류:', error);
        Alert.alert('오류', 'TTS 재생 중 오류가 발생했습니다.');
      } finally {
        setIsPlayingAll(false);
        onStopTTS && onStopTTS();
      }
    }
  };

  return (
    <View style={styles.trendingHeaderSection}>
      <Text style={styles.trendingTitle}>🔥 오늘의 트렌딩 뉴스</Text>
      <Text style={styles.trendingSubtitle}>
        가장 많이 읽히고 있는 뉴스를 AI가 요약해드립니다. 전체 재생 버튼으로 모든 뉴스를 들어보세요!
      </Text>
      
      <ServerStatusIndicator status={serverStatus} />
      
      <TouchableOpacity 
        style={[styles.playAllButton, isPlayingAll && styles.playAllButtonActive]}
        onPress={handlePlayAll}
      >
        <LinearGradient
          colors={isPlayingAll ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
          style={styles.playAllGradient}
        >
          <Text style={styles.playAllButtonText}>
            {isPlayingAll ? '⏹️ 전체 재생 중지' : '🔊 전체 뉴스 재생'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

// 앱 헤더 컴포넌트
interface AppHeaderProps {
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onSearchPress, onNotificationPress }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>SummaNews</Text>
    <View style={styles.headerIcons}>
      <TouchableOpacity style={styles.headerIcon} onPress={onSearchPress}>
        <Text style={styles.iconText}>🔍</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerIcon} onPress={onNotificationPress}>
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
    marginTop: 8,
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
  // 개선된 뉴스 카드 스타일
  enhancedNewsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  enhancedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    lineHeight: 24,
    marginBottom: 8,
  },
  enhancedPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  summaryButton: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryButtonText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  ttsButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: 'center',
  },
  ttsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  linkButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  enhancedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  enhancedDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  enhancedSource: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  // 기존 디자인과 조화로운 스타일들
  summaryExpandedContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ttsActionButton: {
    backgroundColor: '#10b981',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
    alignItems: 'center',
  },
  ttsActiveButton: {
    backgroundColor: '#ef4444',
  },
  ttsActionButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  linkActionButton: {
    backgroundColor: '#6366f1',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
    alignItems: 'center',
  },
  linkActionButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },

  // 현대적인 뉴스 카드 스타일들
  modernNewsCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardGradient: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 12,
  },
  modernCategoryTag: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  modernCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  bookmarkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookmarkIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modernImageContainer: {
    position: 'relative',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modernNewsImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F3F4F6',
  },
  modernTrendBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 40,
  },
  modernTrendText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modernNewsContent: {
    padding: 16,
  },
  modernNewsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    lineHeight: 24,
    marginBottom: 8,
  },
  modernNewsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  modernNewsSummary: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  modernActionBar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modernTTSButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modernTTSActive: {
    // Active state handled by gradient colors
  },
  ttsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  modernTTSIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  modernTTSText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modernSummaryButton: {
    backgroundColor: '#F0F9FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernSummaryText: {
    fontSize: 14,
    color: '#0369A1',
    fontWeight: '600',
  },
  modernNewsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernNewsDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modernNewsSource: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  playAllButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  playAllButtonActive: {
    // Active state handled by gradient
  },
  playAllGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stopAllButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modernLinkButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 8,
  },
  fullWidthButton: {
    marginLeft: 0,
  },
  linkGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  modernLinkIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  modernLinkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});