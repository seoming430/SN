// components/BookmarksScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { StorageService } from '../services/StorageService';
import { NewsItem } from '../types/news';

interface BookmarksScreenProps {
  onBack: () => void;
  onNewsPress: (newsItem: NewsItem) => void;
}

export const BookmarksScreen: React.FC<BookmarksScreenProps> = ({
  onBack,
  onNewsPress,
}) => {
  const [bookmarks, setBookmarks] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const bookmarksData = await StorageService.getBookmarks();
      setBookmarks(bookmarksData);
      
      // 스크롤을 맨 위로 이동
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    } catch (error) {
      console.error('스크랩 로드 오류:', error);
      Alert.alert('오류', '스크랩을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (newsId: string) => {
    try {
      const success = await StorageService.removeBookmark(newsId);
      if (success) {
        setBookmarks(prev => prev.filter(item => item.id !== newsId));
        Alert.alert('스크랩 해제', '스크랩에서 제거되었습니다.');
        await StorageService.updateScrapCount();
      }
    } catch (error) {
      console.error('스크랩 제거 오류:', error);
      Alert.alert('오류', '스크랩 해제에 실패했습니다.');
    }
  };

  const renderBookmarkItem = (item: NewsItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.bookmarkCard}
      onPress={() => onNewsPress(item)}
    >
      <View style={styles.bookmarkContent}>
        <View style={styles.bookmarkHeader}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              removeBookmark(item.id);
            }}
            style={styles.removeButton}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.bookmarkTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        {item.summary && (
          <Text style={styles.bookmarkSummary} numberOfLines={3}>
            {item.summary}
          </Text>
        )}
        
        <View style={styles.bookmarkFooter}>
          <Text style={styles.bookmarkDate}>{item.date}</Text>
          <Text style={styles.bookmarkSource}>• {item.source}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>스크랩</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 스크랩 목록 */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>스크랩을 불러오는 중...</Text>
          </View>
        ) : bookmarks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📌</Text>
            <Text style={styles.emptyTitle}>스크랩한 뉴스가 없습니다</Text>
            <Text style={styles.emptyMessage}>
              관심 있는 뉴스를 스크랩해보세요
            </Text>
          </View>
        ) : (
          bookmarks.map(renderBookmarkItem)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#374151',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
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
  bookmarkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookmarkContent: {
    padding: 16,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  removeButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookmarkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 22,
  },
  bookmarkSummary: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  bookmarkFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookmarkDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  bookmarkSource: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
});

export default BookmarksScreen;
