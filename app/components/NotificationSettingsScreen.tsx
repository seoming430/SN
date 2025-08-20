// components/NotificationSettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { StorageService, NotificationSettings } from '../services/StorageService';

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

  const categories = ['정치', '경제', '사회', '문화', '스포츠', 'IT/과학', '국제', '연예'];
  const frequencies = [
    { value: 'immediate', label: '즉시 알림', desc: '중요 뉴스 발생 시 즉시' },
    { value: 'daily', label: '하루 한 번', desc: '매일 설정한 시간에' },
    { value: 'weekly', label: '주 1회', desc: '매주 월요일 오전' },
  ];

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림 설정</Text>
        <View style={styles.headerSpace} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 알림 활성화 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>푸시 알림</Text>
              <Text style={styles.sectionDesc}>뉴스 알림을 받습니다</Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => setSettings({...settings, enabled: value})}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {settings.enabled && (
          <>
            {/* 알림 빈도 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>알림 빈도</Text>
              <View style={styles.radioGroup}>
                {frequencies.map((freq) => (
                  <TouchableOpacity
                    key={freq.value}
                    style={[
                      styles.radioItem,
                      settings.frequency === freq.value && styles.radioItemActive
                    ]}
                    onPress={() => setSettings({...settings, frequency: freq.value as any})}
                  >
                    <View style={styles.radioButton}>
                      {settings.frequency === freq.value && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <View style={styles.radioContent}>
                      <Text style={[
                        styles.radioLabel,
                        settings.frequency === freq.value && styles.radioLabelActive
                      ]}>{freq.label}</Text>
                      <Text style={styles.radioDesc}>{freq.desc}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 관심 카테고리 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>관심 카테고리</Text>
              <Text style={styles.sectionDesc}>선택한 카테고리의 뉴스만 알림을 받습니다</Text>
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

            {/* 시간 설정 (daily인 경우) */}
            {settings.frequency === 'daily' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>알림 시간</Text>
                <View style={styles.timeSelector}>
                  {['06:00', '09:00', '12:00', '18:00', '21:00'].map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeButton,
                        settings.dailyNewsTime === time && styles.timeButtonActive
                      ]}
                      onPress={() => setSettings({...settings, dailyNewsTime: time})}
                    >
                      <Text style={[
                        styles.timeButtonText,
                        settings.dailyNewsTime === time && styles.timeButtonTextActive
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
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
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSpace: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  radioGroup: {
    marginTop: 12,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  radioItemActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4F46E5',
  },
  radioContent: {
    flex: 1,
  },
  radioLabel: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  radioLabelActive: {
    color: '#4F46E5',
  },
  radioDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  timeButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 24,
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
});