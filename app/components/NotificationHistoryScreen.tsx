// components/NotificationHistoryScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

interface NotificationHistoryScreenProps {
  onBack: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'news' | 'reminder' | 'system';
}

export const NotificationHistoryScreen: React.FC<NotificationHistoryScreenProps> = ({
  onBack,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // 실제로는 AsyncStorage나 서버에서 알림 내역을 가져와야 함
      // 현재는 더미 데이터 사용
      const dummyNotifications: NotificationItem[] = [
        {
          id: '1',
          title: '오늘의 뉴스',
          message: '새로운 정치 뉴스가 도착했습니다.',
          time: '2시간 전',
          isRead: false,
          type: 'news',
        },
        {
          id: '2',
          title: '뉴스 알림',
          message: '경제 뉴스 업데이트가 있습니다.',
          time: '5시간 전',
          isRead: true,
          type: 'news',
        },
        {
          id: '3',
          title: '앱 업데이트',
          message: '새로운 기능이 추가되었습니다.',
          time: '1일 전',
          isRead: true,
          type: 'system',
        },
        {
          id: '4',
          title: '뉴스 리마인더',
          message: '오늘의 뉴스를 확인해보세요.',
          time: '2일 전',
          isRead: true,
          type: 'reminder',
        },
      ];
      
      setNotifications(dummyNotifications);
    } catch (error) {
      console.error('알림 내역 로드 오류:', error);
      Alert.alert('오류', '알림 내역을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const clearAllNotifications = () => {
    Alert.alert(
      '알림 내역 삭제',
      '모든 알림 내역을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => setNotifications([]),
        },
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'news':
        return '📰';
      case 'reminder':
        return '⏰';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const renderNotificationItem = (item: NotificationItem) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification,
      ]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.notificationIcon}>
        <Text style={styles.iconText}>{getNotificationIcon(item.type)}</Text>
      </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[
            styles.notificationTitle,
            !item.isRead && styles.unreadText
          ]}>
            {item.title}
          </Text>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
        
        <Text style={styles.notificationMessage}>{item.message}</Text>
      </View>
      
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림 내역</Text>
        <TouchableOpacity onPress={clearAllNotifications} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>전체 삭제</Text>
        </TouchableOpacity>
      </View>

      {/* 알림 목록 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>알림 내역을 불러오는 중...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>알림 내역이 없습니다</Text>
            <Text style={styles.emptyMessage}>
              새로운 알림이 도착하면 여기에 표시됩니다
            </Text>
          </View>
        ) : (
          notifications.map(renderNotificationItem)
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
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
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
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
  },
  unreadNotification: {
    borderLeftColor: '#3B82F6',
    backgroundColor: '#F8FAFF',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  unreadText: {
    color: '#111827',
    fontWeight: '700',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
    marginTop: 4,
  },
});

export default NotificationHistoryScreen;
