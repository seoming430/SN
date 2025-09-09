// components/NewsComponents.tsx
import React, { useState, useEffect } from 'react';
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
  Modal,
  FlatList,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../services/StorageService';
// TTS 기능을 위한 안전한 모듈 import
let Tts: any = null;
let ttsInitialized = false;

console.log('🔍 TTS 모듈 로드 시도 중...');
try {
  const ttsModule = require('react-native-tts');
  console.log('📦 TTS 모듈 require 성공:', typeof ttsModule);
  Tts = ttsModule.default || ttsModule;
  console.log('✅ TTS 모듈 로드 성공:', typeof Tts);
  console.log('🔍 TTS 모듈 메서드들:', Tts ? Object.keys(Tts) : '없음');
} catch (error) {
  console.log('⚠️ TTS 모듈 로드 실패:', error);
  console.log('⚠️ 오류 상세:', error instanceof Error ? error.message : String(error));
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
  showTTS?: boolean;
  onTTSStart?: () => void;
  onTTSStop?: () => void;
  onScrapChange?: () => void;
}

interface CategoryTabsProps {
  activeCategory: CategoryType;
  setActiveCategory: (category: CategoryType) => void;
  userCategories: string[];
  setUserCategories: (categories: string[]) => void;
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

// TTS 기능을 위한 함수들 (완전 간소화)
const initializeTts = async () => {
  console.log('🔧 TTS 초기화 시작');
  console.log('🔍 TTS 모듈 존재 여부:', !!Tts);
  
  if (!Tts) {
    console.log('❌ TTS 모듈이 로드되지 않음');
    return false;
  }
  
  try {
    console.log('🔧 TTS 모듈 테스트 중...');
    // TTS 모듈의 기본 메서드들이 존재하는지 확인
    const requiredMethods = ['speak', 'stop', 'setDefaultLanguage', 'setDefaultRate', 'setDefaultPitch'];
    const availableMethods = requiredMethods.filter(method => typeof Tts[method] === 'function');
    console.log('🔍 사용 가능한 TTS 메서드들:', availableMethods);
    
    if (availableMethods.length === requiredMethods.length) {
      console.log('✅ TTS 모듈 사용 가능 - 모든 필수 메서드 존재');
      
      // Android에서 TTS 엔진 초기화 (구글 플레이 자동 실행 방지)
      if (Platform.OS === 'android') {
        console.log('🤖 Android TTS 엔진 상태 확인 중...');
        try {
          // requestInstallEngine() 제거 - 구글 플레이 자동 실행 방지
          // 대신 현재 TTS 엔진 상태만 확인
          const initStatus = await Tts.getInitStatus();
          console.log('🔍 현재 TTS 엔진 상태:', initStatus);
          console.log('✅ Android TTS 엔진 상태 확인 완료');
        } catch (initError) {
          console.log('⚠️ Android TTS 엔진 상태 확인 실패:', initError);
          // 상태 확인 실패해도 계속 진행
        }
      }
      
      ttsInitialized = true;
      return true;
    } else {
      console.log('⚠️ TTS 모듈 불완전 - 일부 메서드 누락');
      return false;
    }
  } catch (error) {
    console.error('❌ TTS 초기화 실패:', error);
    console.error('❌ 오류 상세:', error instanceof Error ? error.message : String(error));
    return false;
  }
};

// TTS 초기화 실행
console.log('🚀 TTS 초기화 실행');
initializeTts().then(result => {
  console.log('🚀 TTS 초기화 결과:', result);
}).catch(error => {
  console.log('🚀 TTS 초기화 오류:', error);
});

// 앱 생명주기 이벤트 리스너 설정
let appStateSubscription: any = null;

const setupAppStateListener = () => {
  console.log('📱 앱 생명주기 리스너 설정 중...');
  
  appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
    console.log('📱 앱 상태 변경:', nextAppState);
    
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      console.log('📱 앱이 백그라운드로 이동 - TTS 중지');
      stopTts().then(() => {
        console.log('✅ 백그라운드 이동 시 TTS 중지 완료');
      }).catch(error => {
        console.error('❌ 백그라운드 이동 시 TTS 중지 오류:', error);
      });
    }
  });
  
  console.log('✅ 앱 생명주기 리스너 설정 완료');
};

// 앱 생명주기 리스너 설정
setupAppStateListener();

let currentTTSPromise: Promise<any> | null = null;
let isTTSStopped = false;

export const speakText = async (text: string, showAlert: boolean = true) => {
  console.log('🎤 TTS 요청:', text.substring(0, 50) + '...');
  console.log('🔍 TTS 모듈 상태:', Tts ? '로드됨' : '로드되지 않음');
  console.log('🔍 TTS 초기화 상태:', ttsInitialized ? '초기화됨' : '초기화되지 않음');
  
  if (!Tts) {
    console.log('❌ TTS 모듈이 없어서 재생할 수 없음');
    if (showAlert) {
      Alert.alert('TTS 오류', 'TTS 기능을 사용할 수 없습니다. react-native-tts 모듈이 설치되지 않았을 수 있습니다.');
    }
    return false;
  }
  
  try {
    console.log('🔊 TTS 재생 시작');
    isTTSStopped = false;
    
    // 텍스트 정리 
    const cleanText = text
      .replace(/[^\w\s가-힣.,!?]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log(`📝 재생할 텍스트 길이: ${cleanText.length}자`);
    console.log(`📝 정리된 텍스트: ${cleanText.substring(0, 100)}...`);
    
    // TTS 이벤트 리스너 설정
    console.log('🎧 TTS 이벤트 리스너 설정 중...');
    
    // TTS 시작 이벤트
    const startListener = Tts.addEventListener('tts-start', (event: any) => {
      console.log('🎵 TTS 실제 시작됨:', event);
    });
    
    // TTS 완료 이벤트
    const finishListener = Tts.addEventListener('tts-finish', (event: any) => {
      console.log('✅ TTS 실제 완료됨:', event);
    });
    
    // TTS 오류 이벤트
    const errorListener = Tts.addEventListener('tts-error', (event: any) => {
      console.log('❌ TTS 오류 이벤트:', event);
    });
    
    // TTS 설정 및 재생 (매번 새로 설정)
    console.log('⚙️ TTS 설정 중...');
    Tts.setDefaultLanguage('ko-KR');
    Tts.setDefaultRate(0.3); // 훨씬 느리게 (0.6 → 0.3)
    Tts.setDefaultPitch(1.0);
    
    // Android에서 오디오 포커스 설정
    if (Platform.OS === 'android') {
      console.log('🔊 Android 오디오 포커스 설정');
      try {
        Tts.setDefaultVoice('ko-KR');
        // 볼륨 설정 시도
        Tts.setDefaultRate(0.3); // 더 느리게
        Tts.setDefaultPitch(1.0);
      } catch (voiceError) {
        console.log('⚠️ TTS 음성 설정 실패:', voiceError);
      }
    }
    
    console.log('⚙️ TTS 설정 완료');
    
    console.log('🎵 TTS speak() 호출 중...');
    const speakPromise = Tts.speak(cleanText);
    console.log('🎵 TTS speak() 호출 완료');
    
    // TTS 완료 대기 (중지 상태 체크 추가)
    try {
      await speakPromise;
      console.log('⏳ TTS Promise 완료');
    } catch (speakError) {
      if (isTTSStopped) {
        console.log('⏹️ TTS가 중지되어 Promise 오류 무시');
      } else {
        console.error('❌ TTS Promise 오류:', speakError);
        throw speakError;
      }
    }
    
    // 이벤트 리스너 정리
    startListener && startListener.remove();
    finishListener && finishListener.remove();
    errorListener && errorListener.remove();
    
    if (!isTTSStopped) {
      console.log('✅ TTS 재생 완료');
    } else {
      console.log('⏹️ TTS가 중지됨');
    }
    
    return !isTTSStopped; // 중지되었으면 false 반환
  } catch (error) {
    if (!isTTSStopped) {
      console.error('❌ TTS 실행 중 오류:', error);
      console.error('❌ 오류 상세:', error instanceof Error ? error.message : String(error));
      console.error('❌ 오류 스택:', error instanceof Error ? error.stack : '스택 없음');
      if (showAlert) {
        Alert.alert('TTS 오류', `TTS 실행 중 문제가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      console.log('⏹️ TTS가 중지되어 오류 무시');
    }
    return false;
  }
};

export const stopTts = async () => {
  console.log('🛑 stopTts 함수 호출됨');
  console.log('🔍 TTS 모듈 상태:', Tts ? '로드됨' : '로드되지 않음');
  
  if (Tts) {
    try {
      isTTSStopped = true;
      console.log('🛑 TTS 중지 요청 - isTTSStopped = true');
      
      // 여러 방법으로 TTS 중지 시도
      console.log('🛑 TTS.stop() 호출 중...');
      Tts.stop();
      
      // 추가 중지 방법들
      try {
        console.log('🛑 Tts.cancel() 호출 시도...');
        if (typeof Tts.cancel === 'function') {
          Tts.cancel();
        }
      } catch (cancelError) {
        console.log('⚠️ Tts.cancel() 실패:', cancelError);
      }
      
      try {
        console.log('🛑 Tts.destroy() 호출 시도...');
        if (typeof Tts.destroy === 'function') {
          Tts.destroy();
        }
      } catch (destroyError) {
        console.log('⚠️ Tts.destroy() 실패:', destroyError);
      }
      
      console.log('⏹️ TTS 중지 완료');
      return true;
    } catch (error) {
      console.error('❌ TTS 중지 오류:', error);
      isTTSStopped = true; // 오류가 있어도 중지된 것으로 처리
      console.log('🔄 isTTSStopped = true로 설정됨');
      return true;
    }
  } else {
    console.log('❌ TTS 모듈이 없어 중지할 수 없음');
    isTTSStopped = true; // 모듈이 없어도 중지된 것으로 처리
    return false;
  }
};

// TTS 정리 함수 (앱 종료 시 호출)
export const cleanupTTS = () => {
  console.log('🧹 TTS 정리 시작');
  
  try {
    // 앱 생명주기 리스너 제거
    if (appStateSubscription) {
      appStateSubscription.remove();
      appStateSubscription = null;
      console.log('✅ 앱 생명주기 리스너 제거됨');
    }
    
    // TTS 중지
    stopTts().then(() => {
      console.log('✅ TTS 정리 완료');
    }).catch(error => {
      console.error('❌ TTS 정리 중 오류:', error);
    });
    
  } catch (error) {
    console.error('❌ TTS 정리 오류:', error);
  }
};

// TTS 테스트 함수
export const testTTS = async () => {
  console.log('🧪 TTS 테스트 시작');
  console.log('🔍 TTS 모듈 상태:', Tts ? '로드됨' : '로드되지 않음');
  console.log('🔍 TTS 초기화 상태:', ttsInitialized ? '초기화됨' : '초기화되지 않음');
  console.log('🔍 플랫폼:', Platform.OS);
  
  if (!Tts) {
    console.log('❌ TTS 모듈이 없어서 테스트할 수 없음');
    Alert.alert('TTS 테스트', 'TTS 모듈이 로드되지 않았습니다.');
    return false;
  }
  
  try {
    // TTS 엔진 상태 확인
    console.log('🔍 TTS 엔진 상태 확인 중...');
    try {
      const engines = await Tts.engines();
      console.log('🔍 사용 가능한 TTS 엔진들:', engines);
    } catch (engineError) {
      console.log('⚠️ TTS 엔진 목록 조회 실패:', engineError);
    }
    
    // 현재 엔진 확인
    try {
      const currentEngine = await Tts.getInitStatus();
      console.log('🔍 현재 TTS 엔진 상태:', currentEngine);
    } catch (statusError) {
      console.log('⚠️ TTS 엔진 상태 조회 실패:', statusError);
    }
    
    // 사용 가능한 음성 확인
    try {
      const voices = await Tts.voices();
      console.log('🔍 사용 가능한 음성들:', voices);
    } catch (voiceError) {
      console.log('⚠️ TTS 음성 목록 조회 실패:', voiceError);
    }
    
    console.log('🧪 간단한 TTS 테스트 실행');
    
    // 1단계: 매우 간단한 테스트
    console.log('🧪 1단계: 기본 TTS 테스트');
    const simpleText = '테스트';
    console.log('🔊 간단한 텍스트로 TTS 시도:', simpleText);
    
    // TTS 설정
    Tts.setDefaultLanguage('ko-KR');
    Tts.setDefaultRate(0.3); // 느리게 조정
    Tts.setDefaultPitch(1.0);
    
    // 직접 TTS 호출
    console.log('🎵 직접 TTS speak() 호출');
    await Tts.speak(simpleText);
    console.log('✅ 직접 TTS 호출 완료');
    
    // 2단계: 조금 더 긴 텍스트
    setTimeout(async () => {
      console.log('🧪 2단계: 조금 더 긴 텍스트 테스트');
      const longerText = '안녕하세요. TTS 테스트입니다.';
      await Tts.speak(longerText);
      console.log('✅ 2단계 TTS 테스트 완료');
    }, 2000);
    
    console.log('✅ TTS 테스트 완료');
    return true;
  } catch (error) {
    console.error('❌ TTS 테스트 실패:', error);
    Alert.alert('TTS 테스트', `TTS 테스트 실패: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
};

// 뉴스 카드 컴포넌트
export const NewsCard: React.FC<{ item: NewsItem; onPress: () => void; showTTS?: boolean; onTTSStart?: () => void; onTTSStop?: () => void; onScrapChange?: () => void; }> = ({ item, onPress, showTTS = true, onTTSStart, onTTSStop, onScrapChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isScrapped, setIsScrapped] = useState(false);

  // 컴포넌트 마운트 시 스크랩 상태 로드
  useEffect(() => {
    loadBookmarkStatus();
  }, [item.id]);

  const loadBookmarkStatus = async () => {
    try {
      const scraps = await StorageService.getBookmarks();
      const isCurrentBookmarked = scraps.some((scrap: any) => scrap.id === item.id);
      setIsScrapped(isCurrentBookmarked);
      console.log('🔍 [NewsCard] 스크랩 상태 로드:', isCurrentBookmarked);
    } catch (error) {
      console.error('스크랩 상태 로드 오류:', error);
    }
  };

  const handleTTS = async () => {
    if (isSpeaking) {
      await stopTts();
      setIsSpeaking(false);
      onTTSStop && onTTSStop();
    } else {
      setIsSpeaking(true);
      onTTSStart && onTTSStart();
      const textToSpeak = `${item.title}. ${item.summary || ''}`;
      await speakText(textToSpeak);
      setIsSpeaking(false);
      onTTSStop && onTTSStop();
    }
  };

  const handleOpenLink = () => {
    if (item.originalUrl) {
      Linking.openURL(item.originalUrl).catch(err => {
        console.error('링크 열기 실패:', err);
        Alert.alert('오류', '링크를 열 수 없습니다.');
      });
    } else {
      Alert.alert('알림', '원문 링크가 없습니다.');
    }
  };

  const handleScrap = async (e: any) => {
    e.stopPropagation();
    
    try {
      if (isScrapped) {
        // 스크랩에서 제거
        const success = await StorageService.removeBookmark(item.id);
        if (success) {
          setIsScrapped(false);
          console.log('🗑️ [NewsCard] 스크랩 제거됨');
          Alert.alert('스크랩 해제', '스크랩에서 제거되었습니다.');
          onScrapChange && onScrapChange(); // 부모 컴포넌트에 변경 알림
          
          // 스크랩 수 업데이트
          await StorageService.updateScrapCount();
        }
      } else {
        // 스크랩에 추가
        const scrapItem = {
          ...item,
          isScrapped: true,
          scrapedAt: new Date().toISOString(),
        };
        const success = await StorageService.addBookmark(scrapItem);
        if (success) {
          setIsScrapped(true);
          console.log('📌 [NewsCard] 스크랩 추가됨');
          Alert.alert('스크랩 추가', '스크랩에 추가되었습니다.');
          onScrapChange && onScrapChange(); // 부모 컴포넌트에 변경 알림
          
          // 스크랩 수 업데이트
          await StorageService.updateScrapCount();
        }
      }
    } catch (error) {
      console.error('스크랩 저장 오류:', error);
      Alert.alert('오류', '스크랩 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <TouchableOpacity style={styles.newsCard} activeOpacity={0.95} onPress={onPress}>
      <View style={styles.newsCardContent}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{item.category}</Text>
          {item.trend_rank && (
            <View style={styles.trendBadge}>
              <Text style={styles.trendText}>🔥 {item.trend_rank}</Text>
            </View>
          )}
          <TouchableOpacity onPress={handleScrap} style={styles.scrapButton}>
            <Text style={[styles.scrapIcon, { color: isScrapped ? '#F59E0B' : '#9CA3AF' }]}>
              {isScrapped ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
        
        <TouchableOpacity 
          style={[styles.expandButton, { marginTop: 8, marginBottom: 8 }]}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text style={styles.expandButtonText}>
            {isExpanded ? '📄 간략히' : '📝 AI 요약보기'}
          </Text>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.summaryExpandedContainer}>
            {item.subtitle && (
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>📄 미리보기</Text>
                <Text style={styles.newsPreview}>
                  {item.subtitle}
                </Text>
              </View>
            )}
            <View style={styles.summarySection}>
              <Text style={styles.summaryLabel}>🤖 AI 요약</Text>
              <Text style={styles.newsSummary}>
                {item.summary || '요약 내용이 없습니다.'}
              </Text>
            </View>
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
export const TrendingNewsCard: React.FC<TrendingNewsCardProps> = ({ item, onPress, apiService, showTTS = true, onTTSStart, onTTSStop, onScrapChange }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isScrapped, setIsScrapped] = useState(false);

  // 컴포넌트 마운트 시 스크랩 상태 로드
  useEffect(() => {
    loadBookmarkStatus();
  }, [item.id]);

  const loadBookmarkStatus = async () => {
    try {
      const scraps = await StorageService.getBookmarks();
      const isCurrentBookmarked = scraps.some((scrap: any) => scrap.id === item.id);
      setIsScrapped(isCurrentBookmarked);
      console.log('🔍 [TrendingNewsCard] 스크랩 상태 로드:', isCurrentBookmarked);
    } catch (error) {
      console.error('스크랩 상태 로드 오류:', error);
    }
  };

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
          `트렌딩 뉴스 ${item.trend_rank}등. ${item.title}. ${item.summary || ''}` :
          `${item.title}. ${item.summary || ''}`;
        await speakText(textToSpeak);
      } catch (error) {
        console.error('TTS 실행 중 오류:', error);
      } finally {
        setIsSpeaking(false);
        onTTSStop && onTTSStop();
      }
    }
  };

  const handleScrap = async (e: any) => {
    e.stopPropagation();
    
    try {
      if (isScrapped) {
        // 스크랩에서 제거
        const success = await StorageService.removeBookmark(item.id);
        if (success) {
          setIsScrapped(false);
          console.log('🗑️ [TrendingCard] 스크랩 제거됨');
          Alert.alert('스크랩 해제', '스크랩에서 제거되었습니다.');
          onScrapChange && onScrapChange(); // 부모 컴포넌트에 변경 알림
          
          // 스크랩 수 업데이트
          await StorageService.updateScrapCount();
        }
      } else {
        // 스크랩에 추가
        const scrapItem = {
          ...item,
          isScrapped: true,
          scrapedAt: new Date().toISOString(),
        };
        const success = await StorageService.addBookmark(scrapItem);
        if (success) {
          setIsScrapped(true);
          console.log('📌 [TrendingCard] 스크랩 추가됨');
          Alert.alert('스크랩 추가', '스크랩에 추가되었습니다.');
          onScrapChange && onScrapChange(); // 부모 컴포넌트에 변경 알림
          
          // 스크랩 수 업데이트
          await StorageService.updateScrapCount();
        }
      }
    } catch (error) {
      console.error('스크랩 저장 오류:', error);
      Alert.alert('오류', '스크랩 처리 중 오류가 발생했습니다.');
    }
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
          <TouchableOpacity onPress={handleScrap} style={styles.scrapButton}>
            <Text style={[styles.scrapIcon, { color: isScrapped ? '#F59E0B' : '#9CA3AF' }]}>
              {isScrapped ? '★' : '☆'}
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
          
          <Text style={styles.modernNewsSummary} numberOfLines={4}>
            {item.summary || '요약 내용이 없습니다.'}
          </Text>
          
          {/* 하단 메타 정보 */}
          <View style={styles.modernNewsFooter}>
            <View style={styles.newsMetaLeft}>
              <Text style={styles.modernNewsDate}>{item.date}</Text>
              <Text style={styles.modernNewsSource}>• {item.source}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// 카테고리 탭 컴포넌트 (사용자 선호 카테고리만 표시)
export const CategoryTabs: React.FC<CategoryTabsProps> = ({ 
  activeCategory, 
  setActiveCategory, 
  userCategories,
  setUserCategories 
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const allCategories = ['정치', '경제', 'IT/과학', '생활·문화', '세계', '스포츠', '사회', '건강', '연예', '환경', '오늘의추천'];

  
  const handleManageCategories = () => {
    setModalVisible(true);
  };

  const toggleCategory = (category: string) => {
    let newCategories;
    if (userCategories.includes(category)) {
      // 제거
      newCategories = userCategories.filter(c => c !== category);
      // 모달이 열려있을 때는 activeCategory를 변경하지 않음
      if (activeCategory === category && newCategories.length > 0 && !modalVisible) {
        setActiveCategory(newCategories[0] as CategoryType);
      }
    } else {
      // 추가
      newCategories = [...userCategories, category];
    }
    setUserCategories(newCategories);
    AsyncStorage.setItem('selectedCategories', JSON.stringify(newCategories));
  };

  const moveCategory = (fromIndex: number, toIndex: number) => {
    const newCategories = [...userCategories];
    const [movedItem] = newCategories.splice(fromIndex, 1);
    newCategories.splice(toIndex, 0, movedItem);
    setUserCategories(newCategories);
    AsyncStorage.setItem('selectedCategories', JSON.stringify(newCategories));
  };

  const handleDragStart = (category: string) => {
    setDraggedItem(category);
    setIsDragging(true);
    console.log('드래그 시작:', category);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setIsDragging(false);
    console.log('드래그 종료');
  };

  const handleDrop = (targetCategory: string) => {
    if (!draggedItem || draggedItem === targetCategory) {
      return;
    }
    
    const fromIndex = userCategories.indexOf(draggedItem);
    const toIndex = userCategories.indexOf(targetCategory);
    
    console.log(`드래그 앤 드롭: ${draggedItem} (${fromIndex}) → ${targetCategory} (${toIndex})`);
    moveCategory(fromIndex, toIndex);
    handleDragEnd();
  };


  return (
    <>
      <View style={styles.tabContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleManageCategories}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabScrollView}
          contentContainerStyle={styles.tabScrollContent}
        >
          {userCategories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.tabButton, activeCategory === category && styles.activeTabButton]}
              onPress={() => setActiveCategory(category as CategoryType)}
            >
              <Text style={[styles.tabButtonText, activeCategory === category && styles.activeTabButtonText]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 카테고리 추가 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>카테고리 설정</Text>
            
            {/* 세로로 반반으로 나눈 카테고리 영역 */}
            <View style={styles.categoryContainer}>
              {/* 위쪽: 선택된 카테고리 (50%) */}
              <View style={styles.selectedCategorySection}>
                <Text style={styles.sectionTitle}>
                  선택된 카테고리 ({userCategories.length}개)
                  {userCategories.length > 0 && <Text style={styles.orderHintText}> - 길게 눌러서 드래그 후 다른 카테고리에 놓기</Text>}
                </Text>
                <ScrollView style={styles.selectedCategoryList}>
                  {userCategories.length === 0 ? (
                    <View style={styles.emptyCategoryMessage}>
                      <Text style={styles.emptyCategoryText}>
                        카테고리를 하나 이상 선택해주세요
                      </Text>
                    </View>
                  ) : (
                    userCategories.map((category, index) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.selectedCategoryItem,
                        draggedItem === category && styles.draggingItem,
                        isDragging && draggedItem !== category && styles.dropTarget
                      ]}
                      onLongPress={() => handleDragStart(category)}
                      onPress={() => {
                        if (isDragging) {
                          handleDrop(category);
                        }
                      }}
                      delayLongPress={500}
                    >
                      <Text style={styles.dragHandle}>☰</Text>
                      <Text style={[styles.selectedCategoryText, draggedItem === category && styles.draggingText]}>
                        {category}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => {
                          if (!isDragging) {
                            toggleCategory(category);
                          }
                        }}
                        disabled={isDragging}
                      >
                        <Text style={[
                          styles.removeButton,
                          isDragging && styles.disabledButton
                        ]}>✕</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>

              {/* 아래쪽: 사용 가능한 카테고리 (50%) */}
              <View style={styles.availableCategorySection}>
                <Text style={styles.sectionTitle}>사용 가능한 카테고리</Text>
                <ScrollView style={styles.categoryList}>
                  {allCategories.filter(cat => !userCategories.includes(cat)).map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={styles.categoryOption}
                      onPress={() => toggleCategory(category)}
                    >
                      <Text style={styles.categoryOptionText}>
                        + {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.closeModalButton,
                userCategories.length === 0 ? styles.disabledModalButton : styles.enabledModalButton
              ]}
              onPress={() => {
                if (userCategories.length === 0) {
                  Alert.alert('알림', '카테고리를 하나 이상 설정해주세요.');
                } else {
                  // 첫 번째 카테고리로 화면 전환
                  if (userCategories.length > 0) {
                    setActiveCategory(userCategories[0] as CategoryType);
                  }
                  setModalVisible(false);
                }
              }}
              disabled={userCategories.length === 0}
            >
              <Text style={[
                styles.closeModalButtonText,
                userCategories.length === 0 ? styles.disabledModalButtonText : styles.enabledModalButtonText
              ]}>
                완료
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

// 하단 네비게이션 컴포넌트
export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { name: TabType; icon: string; label: string }[] = [
    { name: 'trending', icon: '📰', label: '오늘의 뉴스' },
    { name: 'home', icon: '🏠', label: '홈' },
    { name: 'profile', icon: '👤', label: '프로필' },
  ];

  const handlePlayAllTTS = () => {
    console.log('전체 재생 버튼 클릭됨');
    console.log('현재 뉴스 개수:', 0);
    Alert.alert('알림', '재생할 뉴스가 없습니다.');
  };

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={[
            styles.bottomNavButton,
            activeTab === tab.name && styles.activeBottomNavButton
          ]}
          onPress={() => setActiveTab(tab.name)}
        >
          <Text style={[
            styles.bottomNavIcon,
            activeTab === tab.name && styles.activeBottomNavIcon
          ]}>
            {tab.icon}
          </Text>
          <Text style={[
            styles.bottomNavLabel,
            activeTab === tab.name && styles.activeBottomNavLabel
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// 서버 상태 표시 컴포넌트
export const ServerStatusIndicator: React.FC<ServerStatusIndicatorProps> = ({ status }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'connected':
        return { backgroundColor: '#10B981' };
      case 'connecting':
        return { backgroundColor: '#F59E0B' };
      case 'error':
        return { backgroundColor: '#EF4444' };
      default:
        return { backgroundColor: '#6B7280' };
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return '연결됨';
      case 'connecting':
        return '연결 중...';
      case 'error':
        return '연결 오류';
      default:
        return '오프라인';
    }
  };

  return (
    <View style={styles.serverStatus}>
      <View style={[styles.statusDot, getStatusStyle()]} />
      <Text style={styles.statusText}>{getStatusText()}</Text>
    </View>
  );
};

// 헤더 섹션 컴포넌트
export const HeaderSection: React.FC<HeaderSectionProps> = ({ 
  apiService, 
  serverStatus, 
  onStopTTS, 
  isTTSPlaying, 
  newsItems = [],
  onPlayAll 
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const handlePlayAll = async () => {
    if (newsItems.length === 0) {
      Alert.alert('알림', '재생할 뉴스가 없습니다.');
      return;
    }

    console.log('🎵 전체 재생 시작');
    setIsPlaying(true);
    
    // 인트로 메시지
    const introText = '오늘의 추천 뉴스를 전해드리겠습니다. ';
    
    // 모든 뉴스의 텍스트를 합쳐서 재생
    const allNewsText = newsItems.map((item, index) => {
      const rank = item.trend_rank ? `${item.trend_rank}위 뉴스. ` : `${index + 1}번째 뉴스. `;
      return `${rank}${item.title}. ${item.summary || ''}`;
    }).join('. 다음으로 ');

    // 아웃트로 메시지
    const outroText = '. 오늘의 추천 뉴스를 마무리하겠습니다.';

    // 전체 텍스트 조합
    const fullText = introText + allNewsText + outroText;

    console.log(`📝 전체 텍스트 길이: ${fullText.length}자`);

    try {
      await speakText(fullText, false);
      console.log('🎵 전체 재생 완료');
    } catch (error) {
      console.error('TTS 재생 오류:', error);
      Alert.alert('오류', 'TTS 재생 중 문제가 발생했습니다.');
    } finally {
      // TTS 완료 후 버튼 상태 복원
      setIsPlaying(false);
      console.log('🔄 버튼 상태 복원');
      onPlayAll && onPlayAll();
    }
  };

  const handleStopTTS = async () => {
    console.log('🛑 HeaderSection에서 TTS 중지 버튼 클릭됨');
    try {
      console.log('🛑 stopTts() 호출 전 - isPlaying:', isPlaying);
      const stopped = await stopTts();
      console.log('🛑 stopTts() 결과:', stopped);
      
      // 즉시 상태 변경
      setIsPlaying(false);
      console.log('🔄 isPlaying을 false로 설정');
      
      // 부모 컴포넌트에 중지 알림
      onStopTTS && onStopTTS();
      console.log('🔄 onStopTTS 콜백 호출');
      
      console.log('✅ TTS 중지 처리 완료');
    } catch (error) {
      console.error('❌ TTS 중지 오류:', error);
      // 오류가 있어도 상태는 변경
      setIsPlaying(false);
      console.log('🔄 오류 발생 시에도 isPlaying을 false로 설정');
    }
  };

  return (
    <View style={styles.header}>
      <Text style={styles.appTitle}>SummaNews</Text>
      <Text style={styles.appSubtitle}>AI가 요약한 오늘의 뉴스</Text>
      <ServerStatusIndicator status={serverStatus} />
      
      {/* 전체 재생 버튼 */}
      {newsItems.length > 0 && (
        <View style={styles.debugButtonContainer}>
          <TouchableOpacity 
            style={[styles.playAllButton, isPlaying && styles.stopButton]} 
            onPress={() => {
              if (isPlaying) {
                handleStopTTS();
              } else {
                handlePlayAll();
              }
            }}
          >
            <Text style={styles.playAllButtonText}>
              {isPlaying ? '⏹ 중지' : '▶ 전체 재생'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// 스타일 정의
const styles = StyleSheet.create({
  // 헤더 스타일
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  
  // 서버 상태 표시
  serverStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // 디버그 버튼
  debugButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  expandButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  expandButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  playAllButton: {
    backgroundColor: '#818CF8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  playAllButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  
  // 탭 스타일
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#818CF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
    marginRight: 10,
  },
  addButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  tabScrollView: {
    flex: 1,
  },
  tabScrollContent: {
    paddingRight: 15,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeTabButton: {
    backgroundColor: '#818CF8',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  activeTabButtonText: {
    color: 'white',
  },
  
  // 뉴스 카드 스타일
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  newsCardContent: {
    padding: 20,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryText: {
    backgroundColor: '#EFF6FF',
    color: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  trendBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  trendText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 26,
  },
  newsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
    lineHeight: 20,
  },
  newsSummary: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 10,
  },
  summaryExpandedContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  previewSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  newsPreview: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  summarySection: {
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  ttsActionButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  ttsActiveButton: {
    backgroundColor: '#FEE2E2',
  },
  ttsActionButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  linkActionButton: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  linkActionButtonText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  newsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newsDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  newsSource: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 5,
  },

  // 현대적인 카드 스타일
  modernNewsCard: {
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardGradient: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernCategoryTag: {
    backgroundColor: '#818CF8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modernCategoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  scrapButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scrapIcon: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  modernImageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    height: 180,
  },
  modernNewsImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  modernTrendBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modernTrendText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modernNewsContent: {
    paddingHorizontal: 4,
  },
  modernNewsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 26,
  },
  modernNewsSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 22,
  },
  modernNewsSummary: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  modernNewsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  newsMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  linkButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  linkText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modernNewsDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modernNewsSource: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  
  // 하단 네비게이션
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomNavButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeBottomNavButton: {
    backgroundColor: '#F0F9FF',
  },
  bottomNavIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  activeBottomNavIcon: {
    color: '#3B82F6',
  },
  bottomNavLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeBottomNavLabel: {
    color: '#3B82F6',
    fontWeight: '700',
  },

  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '95%',
    maxHeight: '90%',
    minHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  categoryList: {
    flex: 1,
    marginBottom: 10,
  },
  categoryOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  closeModalButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  enabledModalButton: {
    backgroundColor: '#8B5CF6', // 보라색
  },
  disabledModalButton: {
    backgroundColor: '#D1D5DB', // 회색
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  enabledModalButtonText: {
    color: 'white',
  },
  disabledModalButtonText: {
    color: '#9CA3AF',
  },
  
  // 카테고리 순서 조정 스타일
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 10,
    marginBottom: 8,
  },
  orderHintText: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#6B7280',
  },
  emptyCategoryMessage: {
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginVertical: 5,
  },
  emptyCategoryText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  // 세로 반반 레이아웃을 위한 새로운 스타일
  categoryContainer: {
    flex: 1,
    marginTop: 10,
  },
  selectedCategorySection: {
    flex: 1,
    marginBottom: 15,
  },
  availableCategorySection: {
    flex: 1,
  },
  selectedCategoryList: {
    flex: 1,
    marginBottom: 10,
  },
  selectedCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    marginBottom: 6,
    borderRadius: 8,
  },
  dragHandle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginRight: 8,
  },
  selectedCategoryText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  draggingText: {
    opacity: 0.5,
  },
  removeButton: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: 'bold',
    paddingHorizontal: 6,
  },
  draggingItem: {
    backgroundColor: '#E5E7EB',
    opacity: 0.7,
    transform: [{ scale: 1.05 }],
  },
  dropTarget: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  disabledButton: {
    opacity: 0.3,
  },
  
  // 모달 탭 스타일
  modalTabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  modalTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeModalTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modalTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeModalTabText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  
  // 즐겨찾기 스타일
  scrapsList: {
    maxHeight: 400,
  },
  emptyBookmarks: {
    padding: 40,
    alignItems: 'center',
  },
  emptyBookmarksText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  scrapCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scrapImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  scrapCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  scrapCategory: {
    fontSize: 10,
    color: '#FFFFFF',
    backgroundColor: '#818CF8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  scrapTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 18,
    marginBottom: 4,
  },
  scrapDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  removeBookmarkButton: {
    padding: 4,
  },
});

export default {
  TabButton,
  NewsCard,
  TrendingNewsCard,
  CategoryTabs,
  BottomNavigation,
  ServerStatusIndicator,
  HeaderSection,
  speakText,
  stopTts,
  testTTS,
  cleanupTTS,
};