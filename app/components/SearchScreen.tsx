// components/SearchScreen.tsx
import React, { useState, useEffect } from 'react';
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

  const apiService = new NewsApiService();

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    const history = await StorageService.getSearchHistory();
    setSearchHistory(history);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('알림', '검색어를 입력해주세요.');
      return;
    }

    Keyboard.dismiss();
    setIsSearching(true);
    setShowHistory(false);

    try {
      // 검색 기록 저장
      await StorageService.addSearchHistory(searchQuery);
      
      // API 호출 (실제로는 검색 API 엔드포인트 필요)
      const results = await apiService.searchNews(searchQuery);
      setSearchResults(results);
      
      if (results.length === 0) {
        Alert.alert('검색 결과', '검색 결과가 없습니다.');
      }
    } catch (error) {
      console.error('검색 실패:', error);
      Alert.alert('오류', '검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleHistoryPress = (query: string) => {
    setSearchQuery(query);
    handleSearch();
  };

  const clearHistory = async () => {
    Alert.alert(
      '검색 기록 삭제',
      '모든 검색 기록을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearSearchHistory();
            setSearchHistory([]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>◀</Text>
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="뉴스를 검색하세요..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 검색 기록 */}
      {showHistory && searchHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>최근 검색</Text>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.clearButton}>전체 삭제</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.historyList}>
            {searchHistory.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.historyItem}
                onPress={() => handleHistoryPress(item)}
              >
                <Text style={styles.historyIcon}>🕐</Text>
                <Text style={styles.historyText}>{item}</Text>
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
            <TrendingNewsCard
              item={item}
              onPress={() => onNewsPress(item)}
              apiService={apiService}
            />
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
        />
      )}

      {/* 로딩 인디케이터 */}
      {isSearching && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>검색 중...</Text>
        </View>
      )}
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
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#374151',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 10,
  },
  searchButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 18,
  },
  historyContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 2,
    paddingVertical: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  clearButton: {
    fontSize: 14,
    color: '#EF4444',
  },
  historyList: {
    paddingHorizontal: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  historyText: {
    fontSize: 15,
    color: '#6B7280',
    flex: 1,
  },
  resultsContainer: {
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
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
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});