// components/SearchScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Keyboard,
} from 'react-native';
import { NewsItem } from '../types/news';
import { NewsApiService } from '../services/NewsApiService';
import { StorageService } from '../services/StorageService';
import { TrendingNewsCard } from './NewsComponents';

interface SearchScreenProps {
  onBack: () => void;
  onNewsPress: (news: NewsItem) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onBack, onNewsPress }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NewsItem[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  // ✅ 매 렌더마다 새로 만들지 않도록 고정
  const apiServiceRef = useRef<NewsApiService | null>(null);
  if (!apiServiceRef.current) apiServiceRef.current = new NewsApiService();
  const apiService = apiServiceRef.current;

  // 언마운트 안전장치
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    loadSearchHistory();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadSearchHistory = async () => {
    const history = await StorageService.getSearchHistory();
    setSearchHistory(Array.isArray(history) ? history : []);
  };

  // ✅ 인수 우선 검색 (히스토리 탭 직후 setState 지연 문제 해결)
  const handleSearch = async (q?: string) => {
    const query = (q ?? searchQuery).trim();
    if (!query) {
      Alert.alert('알림', '검색어를 입력해주세요.');
      return;
    }

    Keyboard.dismiss();
    setIsSearching(true);
    setShowHistory(false);

    try {
      // 히스토리: 중복 제거 + 최근 앞으로
      const nextHistory = [query, ...searchHistory.filter((h) => h !== query)];
      setSearchHistory(nextHistory);
      await StorageService.addSearchHistory(query);

      const results = await apiService.searchNews(query);
      if (!mountedRef.current) return;

      setSearchResults(Array.isArray(results) ? results : []);
      if (!results || results.length === 0) {
        // 리스트 EmptyComponent와 중복 경고 방지 위해 Alert는 옵션으로 유지
        // Alert.alert('검색 결과', '검색 결과가 없습니다.');
      }
    } catch (error) {
      console.error('검색 실패:', error);
      if (mountedRef.current) Alert.alert('오류', '검색 중 오류가 발생했습니다.');
    } finally {
      if (mountedRef.current) setIsSearching(false);
    }
  };

  const handleHistoryPress = (query: string) => {
    setSearchQuery(query);
    handleSearch(query); // ✅ 인수 전달
  };

  const clearHistory = async () => {
    Alert.alert('검색 기록 삭제', '모든 검색 기록을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await StorageService.clearSearchHistory();
          setSearchHistory([]);
        },
      },
    ]);
  };

  const clearQuery = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowHistory(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <Text style={styles.backIcon}>◀</Text>
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="뉴스를 검색하세요..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.trim().length === 0) {
                setShowHistory(true);
                setSearchResults([]);
              }
            }}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoFocus
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={clearQuery}
              style={styles.clearInputButton}
              accessibilityRole="button"
              accessibilityLabel="검색어 지우기"
            >
              <Text style={styles.clearInputIcon}>✕</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => handleSearch()}
            style={styles.searchButton}
            accessibilityRole="button"
            accessibilityLabel="검색"
          >
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 검색 기록 */}
      {showHistory && searchHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>최근 검색</Text>
            <TouchableOpacity onPress={clearHistory} accessibilityLabel="검색 기록 전체 삭제">
              <Text style={styles.clearButton}>전체 삭제</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.historyList}>
            {searchHistory.map((item, index) => (
              <TouchableOpacity
                key={`${item}-${index}`}
                style={styles.historyItem}
                onPress={() => handleHistoryPress(item)}
                accessibilityLabel={`최근 검색 ${item}`}
              >
                <Text style={styles.historyIcon}>🕐</Text>
                <Text style={styles.historyText} numberOfLines={1}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 검색 결과 */}
      {!showHistory && (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TrendingNewsCard item={item} onPress={() => onNewsPress(item)} apiService={apiService} />
          )}
          ListEmptyComponent={
            !isSearching ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.resultsContainer}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* 로딩 인디케이터 */}
      {isSearching && (
        <View style={styles.loadingContainer} pointerEvents="none">
          <Text style={styles.loadingText}>검색 중...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 20, color: '#374151' },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginLeft: 12,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#111827', paddingVertical: 10 },
  searchButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  searchIcon: { fontSize: 18 },

  // 🔹 입력 지우기 버튼
  clearInputButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  clearInputIcon: { fontSize: 16, color: '#6B7280' },

  historyContainer: { backgroundColor: '#FFFFFF', marginTop: 2, paddingVertical: 16 },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  clearButton: { fontSize: 14, color: '#EF4444' },
  historyList: { paddingHorizontal: 20 },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyIcon: { fontSize: 16, marginRight: 12 },
  historyText: { fontSize: 15, color: '#6B7280', flex: 1 },

  resultsContainer: { paddingVertical: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#6B7280' },

  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  loadingText: { color: '#FFFFFF', fontSize: 14 },
});
