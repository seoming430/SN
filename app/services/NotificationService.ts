// services/NotificationService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import notifee, { AndroidImportance, TriggerType, RepeatFrequency } from '@notifee/react-native';

export interface NotificationSchedule {
  hour: number;
  minute: number;
  ampm: 'AM' | 'PM';
  enabled: boolean;
}

export class NotificationService {
  
  constructor() {
    console.log('📱 NotificationService 초기화됨');
    this.configure();
  }

  private async configure() {
    // 알림 채널 생성
    await notifee.createChannel({
      id: 'news-channel',
      name: 'News Notifications',
      importance: AndroidImportance.HIGH,
    });

    // 알림 권한 요청
    await notifee.requestPermission();
  }

  // 알림 스케줄 설정 (간소화됨)
  async scheduleDaily(schedule: NotificationSchedule) {
    try {
      // 설정만 저장 (실제 푸시 알림은 서버에서 처리)
      await AsyncStorage.setItem('notificationSchedule', JSON.stringify(schedule));
      console.log(`✅ 알림 스케줄 설정: ${schedule.hour}:${schedule.minute.toString().padStart(2, '0')} ${schedule.ampm}`);
      
      if (schedule.enabled) {
        console.log('📱 알림이 활성화되었습니다. 서버에서 알림을 발송합니다.');
      } else {
        console.log('🔕 알림이 비활성화되었습니다.');
      }
    } catch (error) {
      console.error('알림 설정 저장 실패:', error);
      throw error;
    }
  }

  // 저장된 알림 설정 불러오기
  async getSchedule(): Promise<NotificationSchedule | null> {
    try {
      const saved = await AsyncStorage.getItem('notificationSchedule');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('알림 설정 불러오기 실패:', error);
      return null;
    }
  }

  // 테스트 알림 (실제 푸시 알림)
  async sendTestNotification() {
    try {
      await notifee.displayNotification({
        title: '🧪 테스트 알림',
        body: 'SummaNews 알림이 정상 작동합니다!',
        android: {
          channelId: 'news-channel',
          importance: AndroidImportance.HIGH,
        },
      });
      console.log('📱 테스트 알림 전송 완료');
    } catch (error) {
      console.error('테스트 알림 전송 실패:', error);
      Alert.alert('테스트 알림', '알림 전송에 실패했습니다.');
    }
  }

  // 매일 알림 스케줄링
  async scheduleNewsNotification(hour: number, minute: number) {
    try {
      // 기존 알림 모두 취소
      await notifee.cancelAllNotifications();
      
      const now = new Date();
      const fireDate = new Date();
      fireDate.setHours(hour, minute, 0, 0);
      
      // 오늘 시간이 이미 지났으면 내일로 설정
      if (fireDate < now) {
        fireDate.setDate(fireDate.getDate() + 1);
      }

      // 매일 반복 알림 생성
      await notifee.createTriggerNotification(
        {
          title: '📰 오늘의 뉴스',
          body: '새로운 뉴스를 확인해보세요!',
          android: {
            channelId: 'news-channel',
            importance: AndroidImportance.HIGH,
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: fireDate.getTime(),
          repeatFrequency: RepeatFrequency.DAILY,
        },
      );

      console.log(`📅 매일 ${hour}:${minute.toString().padStart(2, '0')}에 뉴스 알림 예약됨`);
    } catch (error) {
      console.error('알림 스케줄링 실패:', error);
    }
  }

  // 알림 취소
  async cancelNotifications() {
    try {
      await notifee.cancelAllNotifications();
      console.log('🔕 모든 알림이 취소되었습니다');
    } catch (error) {
      console.error('알림 취소 실패:', error);
    }
  }
}

export const notificationService = new NotificationService();