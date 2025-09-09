// components/NotificationSettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { StorageService, NotificationSettings } from '../services/StorageService';
import { notificationService } from '../services/NotificationService';

const { width } = Dimensions.get('window');

interface NotificationSettingsScreenProps {
  onBack: () => void;
}

export const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    dailyNewsTime: '09:00',
    categories: [],
    frequency: 'daily',
  });
  const [showCustomTimePicker, setShowCustomTimePicker] = useState(false);
  const [customTime, setCustomTime] = useState(() => {
    if (settings.dailyNewsTime) {
      const [hour, minute] = settings.dailyNewsTime.split(':').map(Number);
      return {
        hour: hour === 0 ? 12 : hour > 12 ? hour - 12 : hour,
        minute,
        period: hour >= 12 ? 'PM' : 'AM'
      };
    }
    return { hour: 9, minute: 0, period: 'AM' };
  });

  const categories = ['정치', '경제', '사회', '생활·문화', '스포츠', 'IT/과학', '국제', '연예'];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const saved = await StorageService.getNotificationSettings();
    setSettings(saved);
  };

  const handleSave = async () => {
    const success = await StorageService.saveNotificationSettings(settings);
    if (success) {
      // 알림이 활성화되어 있고 매일 빈도인 경우 스케줄링
      if (settings.enabled && settings.frequency === 'daily' && settings.dailyNewsTime) {
        const [hour, minute] = settings.dailyNewsTime.split(':').map(Number);
        await notificationService.scheduleNewsNotification(hour, minute);
      } else {
        await notificationService.cancelNotifications();
      }
      
      Alert.alert('저장 완료', '알림 설정이 저장되었습니다.', [
        { text: '확인', onPress: onBack }
      ]);
    } else {
      Alert.alert('오류', '설정 저장에 실패했습니다.');
    }
  };

  const toggleCategory = (category: string) => {
    setSettings(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const renderTimeOptions = () => (
    <View style={styles.timeOptionsContainer}>
      <TouchableOpacity
        style={[styles.timeOption, settings.dailyNewsTime === '08:00' && styles.timeOptionActive]}
        onPress={() => setSettings({...settings, dailyNewsTime: '08:00'})}
      >
        <Text style={styles.timeOptionLabel}>출퇴근 루틴 (AM 8:00 / PM 18:30)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.timeOption, settings.dailyNewsTime === '12:30' && styles.timeOptionActive]}
        onPress={() => setSettings({...settings, dailyNewsTime: '12:30'})}
      >
        <Text style={styles.timeOptionLabel}>식후 루틴 (AM 12:30 / PM 19:30)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.timeOption, settings.dailyNewsTime === '20:00' && styles.timeOptionActive]}
        onPress={() => setSettings({...settings, dailyNewsTime: '20:00'})}
      >
        <Text style={styles.timeOptionLabel}>밤시간 루틴 (AM 8:00 / PM 22:00)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => setShowCustomTimePicker(true)}
      >
        <Text style={styles.skipButtonText}>직접 시간대 설정하기</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCustomTimePicker = () => (
    <View style={styles.timePickerModal}>
      <View style={styles.timePickerContainer}>
        <Text style={styles.timePickerTitle}>알림 시간 설정</Text>
        <View style={styles.timePickerRow}>
          {/* 시간 선택 */}
          <View style={styles.timePicker}>
            <TouchableOpacity 
              style={styles.timePickerButton}
              onPress={() => {
                const newHour = customTime.hour === 12 ? 1 : customTime.hour + 1;
                setCustomTime({ ...customTime, hour: newHour });
              }}
            >
              <Text style={styles.timePickerArrow}>▲</Text>
            </TouchableOpacity>
            <Text style={styles.timePickerValue}>{customTime.hour}</Text>
            <TouchableOpacity 
              style={styles.timePickerButton}
              onPress={() => {
                const newHour = customTime.hour === 1 ? 12 : customTime.hour - 1;
                setCustomTime({ ...customTime, hour: newHour });
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
                setCustomTime({ ...customTime, minute: newMinute });
              }}
            >
              <Text style={styles.timePickerArrow}>▲</Text>
            </TouchableOpacity>
            <Text style={styles.timePickerValue}>{customTime.minute.toString().padStart(2, '0')}</Text>
            <TouchableOpacity 
              style={styles.timePickerButton}
              onPress={() => {
                const newMinute = customTime.minute === 0 ? 50 : customTime.minute - 10;
                setCustomTime({ ...customTime, minute: newMinute });
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
                setCustomTime({ ...customTime, period: newPeriod });
              }}
            >
              <Text style={styles.timePickerArrow}>▲</Text>
            </TouchableOpacity>
            <Text style={styles.timePickerValue}>{customTime.period}</Text>
            <TouchableOpacity 
              style={styles.timePickerButton}
              onPress={() => {
                const newPeriod = customTime.period === 'AM' ? 'PM' : 'AM';
                setCustomTime({ ...customTime, period: newPeriod });
              }}
            >
              <Text style={styles.timePickerArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.timePickerButtons}>
          <TouchableOpacity
            style={styles.timePickerCancelButton}
            onPress={() => setShowCustomTimePicker(false)}
          >
            <Text style={styles.timePickerCancelText}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.timePickerConfirmButton}
            onPress={() => {
              let hour24 = customTime.hour;
              if (customTime.period === 'AM' && customTime.hour === 12) {
                hour24 = 0;
              } else if (customTime.period === 'PM' && customTime.hour !== 12) {
                hour24 = customTime.hour + 12;
              }
              const timeString = `${hour24.toString().padStart(2, '0')}:${customTime.minute.toString().padStart(2, '0')}`;
              setSettings({...settings, dailyNewsTime: timeString});
              setShowCustomTimePicker(false);
            }}
          >
            <Text style={styles.timePickerConfirmText}>확인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#F3F4F6', '#E5E7EB']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>알림 설정</Text>
          <View style={styles.headerSpace} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 알림 활성화 */}
          <View style={styles.section}>
            <Text style={styles.sectionNumber}>1</Text>
            <Text style={styles.sectionTitle}>푸시 알림 활성화</Text>
            <Text style={styles.sectionSubtitle}>뉴스 알림을 받습니다</Text>
            
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggle, settings.enabled && styles.toggleActive]}
                onPress={() => setSettings({...settings, enabled: !settings.enabled})}
              >
                <View style={[styles.toggleThumb, settings.enabled && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
          </View>

          {settings.enabled && (
            <>
              {/* 알림 시간 설정 */}
              <View style={styles.section}>
                <Text style={styles.sectionNumber}>2</Text>
                <Text style={styles.sectionTitle}>매일 뉴스를 볼 시간을 고르세요</Text>
                <Text style={styles.sectionSubtitle}>원하는 뉴스 알림 시간대를 선택해주세요</Text>
                
                {renderTimeOptions()}
              </View>

              {/* 관심 카테고리 */}
              <View style={styles.section}>
                <Text style={styles.sectionNumber}>3</Text>
                <Text style={styles.sectionTitle}>관심 카테고리</Text>
                <Text style={styles.sectionSubtitle}>선택한 카테고리의 뉴스만 알림을 받습니다</Text>
                
                <View style={styles.categoryGrid}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        settings.categories.includes(category) && styles.categoryButtonActive
                      ]}
                      onPress={() => toggleCategory(category)}
                    >
                      <Text style={[
                        styles.categoryButtonText,
                        settings.categories.includes(category) && styles.categoryButtonTextActive
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 테스트 알림 버튼 */}
              <TouchableOpacity 
                style={styles.testButton} 
                onPress={() => notificationService.sendTestNotification()}
              >
                <Text style={styles.testButtonText}>🧪 테스트 알림 보내기</Text>
              </TouchableOpacity>
            </>
          )}

          {/* 저장 버튼 */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              <Text style={styles.saveButtonText}>설정 저장</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        {/* 커스텀 시간 피커 모달 */}
        {showCustomTimePicker && renderCustomTimePicker()}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
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
    fontSize: 24,
    color: '#374151',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSpace: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  toggleContainer: {
    alignItems: 'flex-end',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#4F46E5',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  timeOptionsContainer: {
    gap: 12,
  },
  timeOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  timeOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  timeOptionLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginTop: 8,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  categoryButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4F46E5',
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  testButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timePickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  timePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  timePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  timePicker: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  timePickerButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 8,
  },
  timePickerArrow: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  timePickerValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    paddingVertical: 16,
    minWidth: 60,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginHorizontal: 12,
  },
  timePickerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  timePickerCancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
  },
  timePickerCancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  timePickerConfirmButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    alignItems: 'center',
  },
  timePickerConfirmText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});