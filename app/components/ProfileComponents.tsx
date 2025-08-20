// components/ProfileComponents.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout }) => {
  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '로그아웃', onPress: onLogout, style: 'destructive' }
      ]
    );
  };

  const MenuButton: React.FC<{ title: string; icon: string; onPress: () => void; color?: string }> = ({ 
    title, 
    icon, 
    onPress, 
    color = '#6366F1' 
  }) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: color + '20' }]}>
        <Text style={[styles.menuIconText, { color }]}>{icon}</Text>
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* 프로필 헤더 */}
      <LinearGradient
        colors={['#667EEA', '#764BA2']}
        style={styles.profileHeader}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.userName}>사용자</Text>
          <Text style={styles.userEmail}>user@example.com</Text>
        </View>
      </LinearGradient>

      {/* 통계 카드 */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>42</Text>
          <Text style={styles.statLabel}>읽은 기사</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>18</Text>
          <Text style={styles.statLabel}>즐겨찾기</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>156</Text>
          <Text style={styles.statLabel}>요약 횟수</Text>
        </View>
      </View>

      {/* 메뉴 섹션 */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>설정</Text>
        
        <MenuButton
          title="알림 설정"
          icon="🔔"
          onPress={() => Alert.alert('알림 설정', '알림 설정 기능을 준비 중입니다.')}
          color="#10B981"
        />
        
        <MenuButton
          title="언어 설정"
          icon="🌐"
          onPress={() => Alert.alert('언어 설정', '언어 설정 기능을 준비 중입니다.')}
          color="#3B82F6"
        />
        
        <MenuButton
          title="테마 설정"
          icon="🎨"
          onPress={() => Alert.alert('테마 설정', '테마 설정 기능을 준비 중입니다.')}
          color="#8B5CF6"
        />
        
        <MenuButton
          title="즐겨찾기"
          icon="⭐"
          onPress={() => Alert.alert('즐겨찾기', '즐겨찾기한 기사 목록을 준비 중입니다.')}
          color="#F59E0B"
        />
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>지원</Text>
        
        <MenuButton
          title="고객센터"
          icon="💬"
          onPress={() => Alert.alert('고객센터', '고객센터 연결 기능을 준비 중입니다.')}
          color="#06B6D4"
        />
        
        <MenuButton
          title="앱 정보"
          icon="ℹ️"
          onPress={() => Alert.alert('앱 정보', 'SummaNews v1.0.0\\nAI 뉴스 요약 서비스')}
          color="#6B7280"
        />
      </View>

      {/* 로그아웃 버튼 */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  profileHeader: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  menuSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIconText: {
    fontSize: 16,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  logoutSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});