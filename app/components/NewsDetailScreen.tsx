// components/NewsDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Share,
  Dimensions,
  SafeAreaView,
  Linking,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { NewsItem } from '../types/news';
import { StorageService } from '../services/StorageService';

const { width, height } = Dimensions.get('window');

interface NewsDetailScreenProps {
  newsItem: NewsItem;
  onBack: () => void;
  onScrapChange?: () => void;
}

export const NewsDetailScreen: React.FC<NewsDetailScreenProps> = ({
  newsItem,
  onBack,
  onScrapChange,
}) => {
  const [isScrapped, setIsScrapped] = useState(false);
  const [showFullSummary, setShowFullSummary] = useState(false);

  // 컴포넌트 마운트 시 스크랩 상태 로드
  useEffect(() => {
    loadBookmarkStatus();
  }, [newsItem.id]);

  const loadBookmarkStatus = async () => {
    try {
      const scraps = await StorageService.getBookmarks();
      const isCurrentBookmarked = scraps.some((scrap: any) => scrap.id === newsItem.id);
      setIsScrapped(isCurrentBookmarked);
      console.log('🔍 [NewsDetailScreen] 스크랩 상태 로드:', isCurrentBookmarked);
    } catch (error) {
      console.error('스크랩 상태 로드 오류:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${newsItem.title}\\n\\n${newsItem.summary}\\n\\n${newsItem.originalUrl || ''}`,
        title: newsItem.title,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleScrap = async () => {
    try {
      if (isScrapped) {
        // 스크랩에서 제거
        const success = await StorageService.removeBookmark(newsItem.id);
        if (success) {
          setIsScrapped(false);
          console.log('🗑️ [NewsDetailScreen] 스크랩 제거됨');
          Alert.alert('스크랩 해제', '스크랩에서 제거되었습니다.');
          onScrapChange && onScrapChange(); // 부모 컴포넌트에 변경 알림
          
          // 스크랩 수 업데이트
          await StorageService.updateScrapCount();
        }
      } else {
        // 스크랩에 추가
        const scrapItem = {
          ...newsItem,
          isScrapped: true,
          scrapedAt: new Date().toISOString(),
        };
        const success = await StorageService.addBookmark(scrapItem);
        if (success) {
          setIsScrapped(true);
          console.log('📌 [NewsDetailScreen] 스크랩 추가됨');
          Alert.alert('스크랩 추가', '스크랩에 추가되었습니다.');
          onScrapChange && onScrapChange(); // 부모 컴포넌트에 변경 알림
          
          // 스크랩 수 업데이트
          await StorageService.updateScrapCount();
        }
      }
    } catch (error) {
      console.error('스크랩 처리 오류:', error);
      Alert.alert('오류', '스크랩 처리에 실패했습니다.');
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleScrap}>
            <Text style={[styles.actionIcon, { color: isScrapped ? '#F59E0B' : '#6B7280' }]}>
              {isScrapped ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Text style={styles.actionIcon}>📤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 이미지 헤더 */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: newsItem.image }} style={styles.newsImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          >
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{newsItem.category}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* 컨텐츠 */}
        <View style={styles.content}>
          <Text style={styles.title}>{newsItem.title}</Text>
          
          <View style={styles.metaInfo}>
            <Text style={styles.source}>{newsItem.source}</Text>
            <Text style={styles.date}>{newsItem.date}</Text>
          </View>

          <Text style={styles.subtitle}>{newsItem.subtitle}</Text>

          {/* 액션 버튼 */}
          <View style={styles.actionBar}>
            <TouchableOpacity 
              style={styles.readMoreButton}
              onPress={() => setShowFullSummary(!showFullSummary)}
            >
              <Text style={styles.readMoreText}>
                {showFullSummary ? '접기' : '전체보기'}
              </Text>
              <Text style={styles.readMoreIcon}>
                {showFullSummary ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 요약 내용 */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>📋 AI 요약</Text>
            <Text 
              style={styles.summaryText}
              numberOfLines={showFullSummary ? undefined : 5}
            >
              {newsItem.summary || '이 기사에 대한 요약 정보가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.'}
            </Text>
          </View>

          {/* 원문 링크 */}
          {newsItem.originalUrl && (
            <View style={styles.originalLinkContainer}>
              <TouchableOpacity 
                style={styles.originalLinkButton}
                onPress={() => {
                  if (newsItem.originalUrl) {
                    Linking.openURL(newsItem.originalUrl).catch(() => 
                      Alert.alert('오류', '링크를 열 수 없습니다.')
                    );
                  } else {
                    Alert.alert('알림', '원문 링크를 찾을 수 없습니다.');
                  }
                }}
              >
                <Text style={styles.originalLinkText}>원문 기사 보기</Text>
                <Text style={styles.originalLinkIcon}>🔗</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 관련 태그 */}
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsTitle}>관련 태그</Text>
            <View style={styles.tags}>
              {['뉴스', newsItem.category, 'AI요약', '최신'].map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#374151',
    marginLeft: -2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  actionIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  newsImage: {
    width: width,
    height: 240,
    backgroundColor: '#F3F4F6',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    lineHeight: 32,
    marginBottom: 12,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  source: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  ttsButton: {
    borderRadius: 12,
    overflow: 'hidden',
    flex: 1,
    marginRight: 8,
  },
  ttsButtonActive: {
    // Active state styling handled by gradient colors
  },
  ttsButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  ttsButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  ttsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  readMoreText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginRight: 4,
  },
  readMoreIcon: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  originalLinkContainer: {
    marginBottom: 24,
  },
  originalLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF4FF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  originalLinkText: {
    fontSize: 16,
    color: '#1D4ED8',
    fontWeight: '600',
    marginRight: 8,
  },
  originalLinkIcon: {
    fontSize: 16,
  },
  tagsContainer: {
    marginBottom: 40,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});