// components/ProfileComponents.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService, NotificationSchedule } from '../services/NotificationService';
import { StorageService, UserStats } from '../services/StorageService';
import { testTTS } from './NewsComponents';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  onLogout: () => void;
  onShowBookmarks?: (newsItem?: any) => void;
  userData?: {name: string, email: string} | null;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout, onShowBookmarks, userData }) => {
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [notificationSchedule, setNotificationSchedule] = useState<NotificationSchedule>({
    hour: 9,
    minute: 0,
    ampm: 'AM',
    enabled: false,
  });
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [showCustomTimeModal, setShowCustomTimeModal] = useState(false);
  const [customTime, setCustomTime] = useState({
    hour: 9,
    minute: 0,
    period: 'AM' as 'AM' | 'PM'
  });
  const [selectedTimes, setSelectedTimes] = useState<Array<{hour: number, minute: number, ampm: 'AM' | 'PM', label: string}>>([]);
  const [showScrap, setShowScrap] = useState(false);
  const [scrapNews, setScrapNews] = useState<any[]>([]);
  const [scrapLoading, setScrapLoading] = useState(false);
  const scrapScrollRef = useRef<ScrollView>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    readArticles: 0,
    scrapArticles: 0,
    lastUpdated: new Date().toISOString()
  });

  useEffect(() => {
    loadUserData();
    loadNotificationSettings();
    loadUserStats(); // 통계 로드 추가
    if (showScrap) {
      // 스크롤을 맨 위로 이동
      setTimeout(() => {
        if (scrapScrollRef.current) {
          scrapScrollRef.current.scrollTo({ y: 0, animated: false });
          console.log('📌 useEffect에서 스크롤 맨 위로 이동');
        }
      }, 200);
    }
  }, [showScrap]);

  // 컴포넌트가 포커스를 받을 때마다 사용자 데이터 다시 로드
  useEffect(() => {
    const unsubscribe = () => {
      loadUserData();
    };
    
    // 컴포넌트가 다시 마운트될 때마다 실행
    return unsubscribe;
  }, []);

  const loadUserData = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      if (email) {
        setUserEmail(email);
      }
      
      // 사용자 이름 로드
      const userPreferences = await AsyncStorage.getItem('userPreferences');
      console.log('🔍 [ProfileScreen] userPreferences 로드:', userPreferences);
      if (userPreferences) {
        const prefs = JSON.parse(userPreferences);
        console.log('👤 [ProfileScreen] 파싱된 prefs:', prefs);
        console.log('📝 [ProfileScreen] prefs.name:', prefs.name);
        if (prefs.name) {
          setUserName(prefs.name);
          console.log('✅ [ProfileScreen] 사용자명 설정됨:', prefs.name);
        } else {
          console.log('❌ [ProfileScreen] prefs.name이 없음');
        }
      } else {
        console.log('❌ [ProfileScreen] userPreferences가 없음');
      }
    } catch (error) {
      console.error('사용자 데이터 로드 실패:', error);
    }
  };


  const loadNotificationSettings = async () => {
    try {
      const saved = await notificationService.getSchedule();
      if (saved) {
        setNotificationSchedule(saved);
        
        // 저장된 설정을 selectedTimes에도 반영
        if (saved.enabled && saved.hour && saved.ampm) {
          const timeData = {
            hour: saved.hour,
            minute: saved.minute || 0,
            ampm: saved.ampm,
            label: getTimeLabel(saved.hour, saved.minute || 0, saved.ampm)
          };
          setSelectedTimes([timeData]);
        }
      } else {
        // 회원가입 시 설정한 시간 불러오기
        const userPrefs = await AsyncStorage.getItem('userPreferences');
        if (userPrefs) {
          const prefs = JSON.parse(userPrefs);
          if (prefs.notificationTime) {
            const notificationSettings = {
              hour: prefs.notificationTime.hour,
              minute: prefs.notificationTime.minute,
              ampm: prefs.notificationTime.ampm,
              enabled: prefs.notifications || false,
            };
            setNotificationSchedule(notificationSettings);
            
            // 회원가입 시 설정한 시간을 selectedTimes에도 반영
            if (notificationSettings.enabled) {
              const timeData = {
                hour: notificationSettings.hour,
                minute: notificationSettings.minute,
                ampm: notificationSettings.ampm,
                label: getTimeLabel(notificationSettings.hour, notificationSettings.minute, notificationSettings.ampm)
              };
              setSelectedTimes([timeData]);
            }
          }
        }
      }
    } catch (error) {
      console.error('알림 설정 로드 실패:', error);
    }
  };

  // 시간 라벨을 가져오는 헬퍼 함수
  const getTimeLabel = (hour: number, minute: number, ampm: string) => {
    if (hour === 8 && ampm === 'AM') return '출퇴근 루틴';
    if (hour === 12 && minute === 30 && ampm === 'PM') return '식후 루틴';
    if (hour === 8 && ampm === 'PM') return '밤시간 루틴';
    return '직접 설정';
  };

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

  const handleNotificationSettings = () => {
    setShowNotificationModal(true);
    // 모달이 나타날 때 애니메이션
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    setIsModalClosing(true);
    // 모달이 사라질 때 애니메이션
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowNotificationModal(false);
      setIsModalClosing(false);
    });
  };

  const saveNotificationSettings = async () => {
    try {
      await notificationService.scheduleDaily(notificationSchedule);
      
      // userPreferences에도 동기화
      const currentPrefs = await AsyncStorage.getItem('userPreferences');
      const prefs = currentPrefs ? JSON.parse(currentPrefs) : {};
      prefs.notificationTime = {
        hour: notificationSchedule.hour,
        minute: notificationSchedule.minute,
        ampm: notificationSchedule.ampm,
      };
      prefs.notifications = notificationSchedule.enabled;
      await AsyncStorage.setItem('userPreferences', JSON.stringify(prefs));
      
      closeModal();
      Alert.alert('성공', '알림 설정이 저장되었습니다.');
    } catch (error) {
      Alert.alert('오류', '알림 설정 저장에 실패했습니다.');
    }
  };


  const handleCustomTime = () => {
    setCustomTime({
      hour: 9,
      minute: 0,
      period: 'AM'
    });
    setShowCustomTimeModal(true);
  };

  const saveCustomTime = () => {
    const timeData = {
      hour: customTime.hour,
      minute: customTime.minute,
      ampm: customTime.period,
      label: '직접 설정'
    };
    setSelectedTimes([...selectedTimes, timeData]);
    setShowCustomTimeModal(false);
  };

  const loadUserStats = async () => {
    try {
      console.log('📊 사용자 통계 로드 시작');
      const stats = await StorageService.getUserStats();
      console.log('📊 사용자 통계 로드됨:', stats);
      setUserStats(stats);
    } catch (error) {
      console.error('사용자 통계 로드 오류:', error);
    }
  };

  const loadScrapNews = async () => {
    try {
      console.log('📌 스크랩 뉴스 로드 시작');
      setScrapLoading(true);
      const scraps = await StorageService.getBookmarks();
      console.log('📌 StorageService.getBookmarks() 결과:', scraps);
      setScrapNews(scraps);
      console.log('📌 스크랩 뉴스 로드됨:', scraps.length, '개');
      console.log('📌 scrapNews 상태 업데이트됨');
      
      // 스크랩 수 업데이트
      await StorageService.updateScrapCount();
      await loadUserStats(); // 통계 다시 로드
      
      // 스크롤을 맨 위로 이동
      setTimeout(() => {
        if (scrapScrollRef.current) {
          scrapScrollRef.current.scrollTo({ y: 0, animated: true });
          console.log('📌 스크롤을 맨 위로 이동');
        }
      }, 100);
    } catch (error) {
      console.error('스크랩 뉴스 로드 오류:', error);
      Alert.alert('오류', '스크랩 뉴스를 불러오는데 실패했습니다.');
    } finally {
      setScrapLoading(false);
    }
  };

  const removeScrap = async (newsId: string) => {
    try {
      const success = await StorageService.removeBookmark(newsId);
      if (success) {
        setScrapNews(prev => prev.filter(item => item.id !== newsId));
        Alert.alert('스크랩 해제', '스크랩에서 제거되었습니다.');
        console.log('🗑️ 스크랩 제거됨:', newsId);
        
        // 스크랩 수 업데이트
        await StorageService.updateScrapCount();
        await loadUserStats(); // 통계 다시 로드
      }
    } catch (error) {
      console.error('스크랩 제거 오류:', error);
      Alert.alert('오류', '스크랩 해제에 실패했습니다.');
    }
  };

  const handleScrapNewsPress = (newsItem: any) => {
    // 스크랩 모달을 닫고 뉴스 상세 화면으로 이동
    setShowScrap(false);
    // 부모 컴포넌트에 뉴스 선택 알림
    if (onShowBookmarks) {
      onShowBookmarks(newsItem);
    }
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
          
          <Text style={styles.userName}>
            {userData?.name || userName || '사용자'}
          </Text>
          
          <Text style={styles.userEmail}>
            {userData?.email || userEmail || 'user@example.com'}
          </Text>
        </View>
      </LinearGradient>

      {/* 통계 카드 */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userStats.readArticles}</Text>
          <Text style={styles.statLabel}>읽은 기사</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userStats.scrapArticles}</Text>
          <Text style={styles.statLabel}>스크랩</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userStats.readArticles + userStats.scrapArticles}</Text>
          <Text style={styles.statLabel}>총 활동</Text>
        </View>
      </View>

      {/* 메뉴 섹션 */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>설정</Text>
        
        <MenuButton
          title="알림 설정"
          icon="🔔"
          onPress={handleNotificationSettings}
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
          title="스크랩"
          icon="📌"
          onPress={async () => {
            console.log('📌 스크랩 버튼 클릭됨');
            console.log('📌 현재 showScrap 상태:', showScrap);
            
            try {
              // 먼저 데이터 로드
              await loadScrapNews();
              console.log('📌 loadScrapNews() 완료');
              
              // 그 다음 화면 표시
              setShowScrap(true);
              console.log('📌 setShowScrap(true) 호출됨');
              
              // 스크롤을 맨 위로 이동
              setTimeout(() => {
                if (scrapScrollRef.current) {
                  scrapScrollRef.current.scrollTo({ y: 0, animated: false });
                  console.log('📌 스크랩 화면 열릴 때 스크롤 맨 위로 이동');
                }
              }, 200);
            } catch (error) {
              console.error('📌 스크랩 로드 중 오류:', error);
              // 에러가 발생해도 화면은 표시
              setShowScrap(true);
            }
          }}
          color="#F59E0B"
        />
        
        <MenuButton
          title="TTS 테스트"
          icon="🔊"
          onPress={async () => {
            console.log('🧪 TTS 테스트 버튼 클릭됨');
            await testTTS();
          }}
          color="#10B981"
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

      {/* 알림 설정 모달 */}
      <Modal visible={showNotificationModal} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [400, 0], // 화면 아래에서 위로 올라옴
                  })
                }]
              }
            ]}
          >
            {/* 헤더 */}
            <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>알림 설정</Text>
            <View style={styles.headerSpacer} />
            </View>

            {/* 스크롤 가능한 내용 영역 */}
            <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {/* 알림 활성화 */}
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>푸시 알림</Text>
                  <Text style={styles.settingDesc}>뉴스 알림을 받습니다</Text>
                </View>
            <TouchableOpacity 
                  style={[styles.switch, notificationSchedule.enabled && styles.switchActive]}
              onPress={() => setNotificationSchedule({...notificationSchedule, enabled: !notificationSchedule.enabled})}
            >
                  <View style={[styles.switchThumb, notificationSchedule.enabled && styles.switchThumbActive]} />
            </TouchableOpacity>
              </View>

            {notificationSchedule.enabled && (
              <>
                  {/* 시간 설정 */}
                  <View style={styles.timeSection}>
                    <Text style={styles.sectionTitle}>알림 시간</Text>
                    
                    {/* 프리셋 시간 옵션 (회원가입과 동일) */}
                    <View style={styles.presetContainer}>
                      <TouchableOpacity
                        style={[styles.presetButton, selectedTimes.some(time => time.hour === 8 && time.ampm === 'AM') && styles.presetButtonActive]}
                        onPress={() => {
                          const timeData = {hour: 8, minute: 0, ampm: 'AM' as 'AM' | 'PM', label: '출퇴근 루틴'};
                          const isSelected = selectedTimes.some(time => time.hour === 8 && time.ampm === 'AM');
                          if (isSelected) {
                            setSelectedTimes(selectedTimes.filter(time => !(time.hour === 8 && time.ampm === 'AM')));
                          } else if (selectedTimes.length < 2) {
                            setSelectedTimes([...selectedTimes, timeData]);
                          }
                        }}
                      >
                        <Text style={styles.presetLabel}>출퇴근 루틴</Text>
                        <Text style={styles.presetSubLabel}>(AM 8:00 / PM 18:30)</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.presetButton, selectedTimes.some(time => time.hour === 12 && time.minute === 30 && time.ampm === 'PM') && styles.presetButtonActive]}
                        onPress={() => {
                          const timeData = {hour: 12, minute: 30, ampm: 'PM' as 'AM' | 'PM', label: '식후 루틴'};
                          const isSelected = selectedTimes.some(time => time.hour === 12 && time.minute === 30 && time.ampm === 'PM');
                          if (isSelected) {
                            setSelectedTimes(selectedTimes.filter(time => !(time.hour === 12 && time.minute === 30 && time.ampm === 'PM')));
                          } else if (selectedTimes.length < 2) {
                            setSelectedTimes([...selectedTimes, timeData]);
                          }
                        }}
                      >
                        <Text style={styles.presetLabel}>식후 루틴</Text>
                        <Text style={styles.presetSubLabel}>(AM 12:30 / PM 19:30)</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.presetButton, selectedTimes.some(time => time.hour === 8 && time.ampm === 'PM') && styles.presetButtonActive]}
                        onPress={() => {
                          const timeData = {hour: 8, minute: 0, ampm: 'PM' as 'AM' | 'PM', label: '밤시간 루틴'};
                          const isSelected = selectedTimes.some(time => time.hour === 8 && time.ampm === 'PM');
                          if (isSelected) {
                            setSelectedTimes(selectedTimes.filter(time => !(time.hour === 8 && time.ampm === 'PM')));
                          } else if (selectedTimes.length < 2) {
                            setSelectedTimes([...selectedTimes, timeData]);
                          }
                        }}
                      >
                        <Text style={styles.presetLabel}>밤시간 루틴</Text>
                        <Text style={styles.presetSubLabel}>(AM 8:00 / PM 20:00)</Text>
                      </TouchableOpacity>
                    </View>

                    {/* 직접 시간대 추가하기 버튼 */}
                    <TouchableOpacity
                      style={[styles.customTimeButton, selectedTimes.length >= 2 && styles.customTimeButtonDisabled]}
                      onPress={selectedTimes.length < 2 ? handleCustomTime : undefined}
                    >
                      <Text style={[styles.customTimeButtonText, selectedTimes.length >= 2 && styles.customTimeButtonTextDisabled]}>
                        직접 시간대 추가하기
                      </Text>
                    </TouchableOpacity>

                    {/* 선택된 시간 표시 */}
                    {selectedTimes.length > 0 && (
                      <View style={styles.selectedTimesContainer}>
                        <Text style={styles.selectedTimesLabel}>선택된 시간 ({selectedTimes.length}/2)</Text>
                        {selectedTimes.map((time, index) => (
                          <View key={index} style={styles.selectedTimeItem}>
                            <View style={styles.selectedTimeInfo}>
                              <Text style={styles.selectedTimeValue}>
                                {time.hour}:{time.minute.toString().padStart(2, '0')} {time.ampm}
                              </Text>
                              <Text style={styles.selectedTimeLabel}>{time.label}</Text>
                            </View>
                            <TouchableOpacity 
                              style={styles.removeTimeButton}
                              onPress={() => setSelectedTimes(selectedTimes.filter((_, i) => i !== index))}
                            >
                              <Text style={styles.removeTimeButtonText}>×</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </>
              )}
            </ScrollView>

            {/* 고정된 버튼들 */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={closeModal}
              >
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveBtn}
                onPress={saveNotificationSettings}
              >
                <Text style={styles.saveBtnText}>저장</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* 커스텀 시간 설정 모달 */}
      <Modal visible={showCustomTimeModal} transparent animationType="fade">
        <View style={styles.customTimeModalOverlay}>
          <View style={styles.customTimeModalContent}>
            <View style={styles.customTimeModalHeader}>
              <Text style={styles.modalTitle}>직접 시간 설정</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowCustomTimeModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerContainer}>
                  <View style={styles.timePickerSection}>
                <View style={styles.timePickerRow}>
                  <Text style={styles.timePickerLabel}>시간:</Text>
                  
                  {/* 시간 선택 */}
                  <View style={styles.timePicker}>
                    <TouchableOpacity 
                      style={styles.timePickerButton}
                      onPress={() => {
                        const newHour = customTime.hour === 12 ? 1 : customTime.hour + 1;
                        setCustomTime({...customTime, hour: newHour});
                      }}
                    >
                      <Text style={styles.timePickerArrow}>▲</Text>
                    </TouchableOpacity>
                    <Text style={styles.timePickerValue}>{customTime.hour}</Text>
                    <TouchableOpacity 
                      style={styles.timePickerButton}
                      onPress={() => {
                        const newHour = customTime.hour === 1 ? 12 : customTime.hour - 1;
                        setCustomTime({...customTime, hour: newHour});
                      }}
                    >
                      <Text style={styles.timePickerArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.timeSeparator}>:</Text>

                  {/* 분 선택 */}
                  <View style={styles.timePicker}>
                    <TouchableOpacity 
                      style={styles.timePickerButton}
                      onPress={() => {
                        const newMinute = customTime.minute === 50 ? 0 : customTime.minute + 10;
                        setCustomTime({...customTime, minute: newMinute});
                      }}
                    >
                      <Text style={styles.timePickerArrow}>▲</Text>
                    </TouchableOpacity>
                    <Text style={styles.timePickerValue}>{customTime.minute.toString().padStart(2, '0')}</Text>
                    <TouchableOpacity 
                      style={styles.timePickerButton}
                      onPress={() => {
                        const newMinute = customTime.minute === 0 ? 50 : customTime.minute - 10;
                        setCustomTime({...customTime, minute: newMinute});
                      }}
                    >
                      <Text style={styles.timePickerArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  {/* AM/PM 선택 */}
                  <View style={styles.timePicker}>
                    <TouchableOpacity 
                      style={styles.timePickerButton}
                      onPress={() => {
                        const newPeriod = customTime.period === 'AM' ? 'PM' : 'AM';
                        setCustomTime({...customTime, period: newPeriod});
                      }}
                    >
                      <Text style={styles.timePickerArrow}>▲</Text>
                    </TouchableOpacity>
                    <Text style={styles.timePickerValue}>{customTime.period}</Text>
                    <TouchableOpacity 
                      style={styles.timePickerButton}
                      onPress={() => {
                        const newPeriod = customTime.period === 'AM' ? 'PM' : 'AM';
                        setCustomTime({...customTime, period: newPeriod});
                      }}
                    >
                      <Text style={styles.timePickerArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.customTimeButtonContainer}>
              <TouchableOpacity 
                style={styles.customTimeSaveBtn}
                onPress={saveCustomTime}
              >
                <Text style={styles.customTimeSaveBtnText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 스크랩 화면 */}
      <Modal visible={showScrap} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.scrapScreenContainer}>
          <View style={styles.scrapHeader}>
              <TouchableOpacity 
              style={styles.scrapBackButton}
              onPress={() => setShowScrap(false)}
              >
              <Text style={styles.scrapBackButtonText}>‹</Text>
              </TouchableOpacity>
            <Text style={styles.scrapHeaderTitle}>스크랩</Text>
            <View style={styles.scrapHeaderSpacer} />
            </View>

          <ScrollView 
            ref={scrapScrollRef}
            style={styles.scrapContent} 
            showsVerticalScrollIndicator={false}
          >
            {scrapLoading ? (
              <View style={styles.emptyScrapContainer}>
                <Text style={styles.emptyScrapIcon}>⏳</Text>
                <Text style={styles.emptyScrapTitle}>스크랩 뉴스를 불러오는 중...</Text>
                <Text style={styles.emptyScrapMessage}>잠시만 기다려주세요.</Text>
          </View>
            ) : scrapNews.length === 0 ? (
              <View style={styles.emptyScrapContainer}>
                <Text style={styles.emptyScrapIcon}>📌</Text>
                <Text style={styles.emptyScrapTitle}>스크랩한 뉴스가 없습니다</Text>
                <Text style={styles.emptyScrapMessage}>관심있는 뉴스를 스크랩에 추가해보세요.</Text>
        </View>
            ) : (
              scrapNews.map((item, index) => (
                <TouchableOpacity 
                  key={item.id || index} 
                  style={styles.scrapNewsCard}
                  onPress={() => handleScrapNewsPress(item)}
                >
                  <View style={styles.scrapNewsImageContainer}>
                    <Image 
                      source={{ uri: item.image }} 
                      style={styles.scrapNewsImage}
                      defaultSource={{ uri: 'https://via.placeholder.com/80x80/F3F4F6/6B7280?text=No+Image' }}
                    />
                  </View>
                  
                  <View style={styles.scrapNewsContent}>
                    <Text style={styles.scrapNewsTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.scrapNewsMeta}>
                      {item.source} {new Date(item.scrapedAt || item.publishedAt).toLocaleDateString('ko-KR')}
                    </Text>
                    <Text style={styles.scrapNewsSummary} numberOfLines={2}>
                      {item.summary || item.subtitle || '요약 내용이 없습니다.'}
                    </Text>
                    
                    <View style={styles.scrapNewsActions}>
                      <TouchableOpacity 
                        style={styles.scrapNewsButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleScrapNewsPress(item);
                        }}
                      >
                        <Text style={styles.scrapNewsButtonText}>원문보기</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
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
    marginBottom: 8,
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
    marginHorizontal: 6,
    paddingVertical: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuIconText: {
    fontSize: 18,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
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

  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  customTimeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 34,
    paddingHorizontal: 24,
    maxHeight: '95%',
    flex: 1,
  },
  modalScrollContent: {
    flex: 1,
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 24,
  },
  customTimeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },

  // 설정 아이템 스타일
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  switch: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: '#3B82F6',
  },
  switchThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  switchThumbActive: {
    marginLeft: 18,
  },

  // 시간 설정 섹션
  timeSection: {
    marginTop: 16,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  presetButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 8,
  },
  presetButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  presetTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  presetLabel: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  presetSubLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedTimesContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedTimesLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  selectedTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedTimeInfo: {
    flex: 1,
  },
  selectedTimeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  selectedTimeLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  removeTimeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeTimeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // 버튼 스타일
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },


  // 커스텀 시간 설정 모달
  customTimeModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    width: '90%',
    maxHeight: '60%',
  },
    //직접 시간대 설정하기기 버튼
  customTimeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  customTimeButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    opacity: 0.5,
  },
  customTimeButtonText: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '700',
  },
  customTimeButtonTextDisabled: {
    color: '#9CA3AF',
  },
  customTimeButtonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  customTimeSaveBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 60,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  customTimeSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // 시간 선택기 스타일 (회원가입과 동일)
  timePickerContainer: {
    alignItems: 'center',
  },
  timePickerSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerLabel: {
    fontSize: 16,
    color: '#374151',
  },
  timePicker: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  timePickerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  timePickerArrow: {
    fontSize: 20,
    color: '#6B7280',
  },
  timePickerValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    paddingVertical: 10,
    minWidth: 40,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginHorizontal: 5,
  },

  // 즐겨찾기 모달 스타일 (카테고리 설정창과 동일)
  scrapModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '95%',
    maxHeight: '85%',
    minHeight: '60%',
    alignSelf: 'center',
    marginTop: '7.5%',
  },
  scrapList: {
    maxHeight: 400,
    marginBottom: 20,
  },
  emptyBookmarks: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyBookmarksText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  scrapItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  scrapItemContent: {
    flex: 1,
    marginRight: 12,
  },
  scrapItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  scrapItemDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  scrapItemSummary: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  scrapItemButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  scrapItemButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrapToggleButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scrapToggleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeModalButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  closeModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },

  // 스크랩 화면 스타일 (알림 내역 화면과 동일)
  scrapScreenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  scrapBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrapBackButtonText: {
    fontSize: 24,
    color: '#374151',
    marginLeft: -2,
  },
  scrapHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  scrapHeaderSpacer: {
    width: 40,
  },
  scrapContent: {
    flex: 1,
  },
  emptyScrapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyScrapIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyScrapTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyScrapMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  scrapNewsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scrapNewsImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  scrapNewsImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  scrapNewsContent: {
    flex: 1,
  },
  scrapNewsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 22,
  },
  scrapNewsMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  scrapNewsSummary: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  scrapNewsActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  scrapNewsButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  scrapNewsButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

});