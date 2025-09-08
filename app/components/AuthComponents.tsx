// components/AuthComponents.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { AuthState, LoginCredentials, SignupCredentials } from '../types/auth';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, fetchSignInMethodsForEmail } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../services/StorageService';

const { width, height } = Dimensions.get('window');

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [authState, setAuthState] = useState<AuthState>('login');
  const [loginForm, setLoginForm] = useState<LoginCredentials>({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState<SignupCredentials>({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [signupStep, setSignupStep] = useState(1);
  const [userPreferences, setUserPreferences] = useState({
    interests: [] as string[],
    readingFrequency: '',
    readingTime: '',
    customTime: { hour: 8, minute: 0, period: 'AM' },
    notificationSettings: {
      morning: false,
      lunch: false,
      evening: false,
    },
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const TOTAL_STEPS = 5;

  // 컴포넌트 마운트 시 Firebase 연결 테스트
  useEffect(() => {
    testFirebaseConnection();
  }, []);

  // Firebase 연결 테스트 함수
  const testFirebaseConnection = async () => {
    try {
      console.log('🧪 Firebase 연결 테스트 시작...');
      console.log('🔥 Firebase 앱:', auth.app.name);
      console.log('🔐 Firebase Auth:', auth);
      
      // 간단한 Firebase API 호출 테스트
      const testEmail = 'test@example.com';
      const signInMethods = await fetchSignInMethodsForEmail(auth, testEmail);
      console.log('✅ Firebase 연결 성공! API 응답:', signInMethods);
      return true;
    } catch (error: any) {
      console.error('❌ Firebase 연결 실패:', error);
      console.error('❌ 오류 코드:', error.code);
      console.error('❌ 오류 메시지:', error.message);
      return false;
    }
  };

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔐 로그인 시도 시작:', loginForm.email);
      console.log('🔥 Firebase Auth 상태:', auth);
      
      const userCredential = await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      console.log('✅ 로그인 성공:', userCredential.user.email);
      
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userEmail', loginForm.email);
      await AsyncStorage.setItem('userId', userCredential.user.uid);
      
      console.log('🎉 로그인 완료 - 사용자 데이터 다시 로드');
      Alert.alert('로그인 성공', '환영합니다!', [{ text: '확인', onPress: onAuthSuccess }]);
    } catch (error: any) {
      console.error('❌ 로그인 오류:', error);
      console.error('❌ 오류 코드:', error.code);
      console.error('❌ 오류 메시지:', error.message);
      
      let errorMessage = '로그인에 실패했습니다.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = '등록되지 않은 이메일입니다.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '비밀번호가 올바르지 않습니다.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '올바르지 않은 이메일 형식입니다.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = '네트워크 연결을 확인하고 다시 시도해주세요.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
      }
      Alert.alert('로그인 오류', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      console.log('📝 회원가입 시도 시작:', signupForm.email);
      console.log('🔥 Firebase Auth 상태:', auth);
      
      const userCredential = await createUserWithEmailAndPassword(auth, signupForm.email, signupForm.password);
      console.log('✅ 회원가입 성공:', userCredential.user.email);
      console.log('🆔 사용자 ID:', userCredential.user.uid);
      
      await updateProfile(userCredential.user, {
        displayName: signupForm.name
      });
      console.log('👤 프로필 업데이트 완료:', signupForm.name);
      
      // 사용자 ID 기반으로 데이터 저장
      const userId = userCredential.user.uid;
      
      // 기존 사용자 데이터 완전 초기화
      console.log('🧹 [AuthScreen] 기존 사용자 데이터 초기화 시작');
      await StorageService.clearUserData();
      console.log('✅ [AuthScreen] 기존 사용자 데이터 초기화 완료');
      
      // 새로운 사용자 데이터 저장
      const userData = {
        ...userPreferences,
        userId: userId,
        name: signupForm.name,
        email: signupForm.email,
        createdAt: new Date().toISOString()
      };
      
      console.log('💾 [AuthScreen] 저장할 userData:', userData);
      console.log('👤 [AuthScreen] 저장할 사용자명:', signupForm.name);
      
      await AsyncStorage.setItem('userPreferences', JSON.stringify(userData));
      await AsyncStorage.setItem('userName', signupForm.name);
      await AsyncStorage.setItem('userEmail', signupForm.email);
      await AsyncStorage.setItem('isLoggedIn', 'true');
      console.log('✅ [AuthScreen] 새로운 사용자 데이터 저장 완료');
      
      // 저장 후 즉시 확인
      const savedData = await AsyncStorage.getItem('userPreferences');
      const savedUserName = await AsyncStorage.getItem('userName');
      console.log('🔍 [AuthScreen] 저장 후 확인 - userPreferences:', savedData);
      console.log('🔍 [AuthScreen] 저장 후 확인 - userName:', savedUserName);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        console.log('👤 [AuthScreen] 저장된 사용자명 (userPreferences):', parsed.name);
      }
      await AsyncStorage.setItem('selectedCategories', JSON.stringify(userPreferences.interests));
      await AsyncStorage.setItem('userId', userId);
      
      // 알림 설정을 NotificationSettings 형태로 변환하여 저장
      let dailyNewsTimes: string[] = [];
      
      // Q3에서 선택한 시간대에 따라 알림 시간 설정
      if (userPreferences.readingTime === 'morning') {
        dailyNewsTimes = ['08:00', '18:30']; // 출퇴근 루틴
      } else if (userPreferences.readingTime === 'lunch') {
        dailyNewsTimes = ['12:30', '19:30']; // 식후 루틴
      } else if (userPreferences.readingTime === 'evening') {
        dailyNewsTimes = ['08:00', '22:00']; // 밤시간 루틴
      } else if (userPreferences.readingTime) {
        // 직접 설정한 시간 (Q4에서 설정한 뉴스 유형이 시간으로 저장된 경우)
        dailyNewsTimes = [`${userPreferences.customTime.hour.toString().padStart(2, '0')}:${userPreferences.customTime.minute.toString().padStart(2, '0')}`];
      }
      
      // Q5에서 선택한 알림 시간대 추가
      if (userPreferences.notificationSettings.morning) {
        dailyNewsTimes.push('08:00');
      }
      if (userPreferences.notificationSettings.lunch) {
        dailyNewsTimes.push('12:30');
      }
      if (userPreferences.notificationSettings.evening) {
        dailyNewsTimes.push('20:00');
      }
      
      // 중복 제거 및 정렬
      dailyNewsTimes = [...new Set(dailyNewsTimes)].sort();
      
      const notificationSettings = {
        enabled: dailyNewsTimes.length > 0 || 
                userPreferences.notificationSettings.morning || 
                userPreferences.notificationSettings.lunch || 
                userPreferences.notificationSettings.evening ||
                userPreferences.readingTime !== '',
        dailyNewsTimes: dailyNewsTimes, // 여러 시간대 지원
        dailyNewsTime: dailyNewsTimes[0] || '08:00', // 첫 번째 시간 (하위 호환성)
        categories: userPreferences.interests,
        frequency: 'daily' as const,
      };
      
      await AsyncStorage.setItem('@SummaNews:notifications', JSON.stringify(notificationSettings));
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userEmail', signupForm.email);
      
      console.log('💾 회원가입 시 저장된 알림 설정:', notificationSettings);
      console.log('📅 Q3에서 선택한 시간대:', userPreferences.readingTime);
      console.log('⏰ 설정된 알림 시간들:', dailyNewsTimes);
      
      Alert.alert('회원가입 성공', '가입이 완료되었습니다!', [
        { text: '확인', onPress: onAuthSuccess }
      ]);
    } catch (error: any) {
      console.error('❌ 회원가입 오류:', error);
      console.error('❌ 오류 코드:', error.code);
      console.error('❌ 오류 메시지:', error.message);
      
      let errorMessage = '회원가입에 실패했습니다.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일입니다.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다. 6자 이상 입력해주세요.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '올바르지 않은 이메일 형식입니다.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = '네트워크 연결을 확인하고 다시 시도해주세요.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
      Alert.alert('회원가입 오류', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      console.log('🔍 이메일 중복 확인 시작:', email);
      console.log('🔥 Firebase Auth 객체:', auth);
      console.log('🌐 Firebase 앱 이름:', auth.app.name);
      
      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('❌ 잘못된 이메일 형식');
        return false;
      }
      
      console.log('📡 Firebase API 호출 시작...');
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      console.log('📧 가입된 방법들:', signInMethods);
      const exists = signInMethods.length > 0;
      console.log('✅ 이메일 존재 여부:', exists);
      
      if (exists) {
        console.log('⚠️ 중복된 이메일 발견!');
      }
      
      return exists;
    } catch (error: any) {
      console.error('❌ 이메일 확인 중 오류:', error);
      console.error('❌ 오류 코드:', error.code);
      console.error('❌ 오류 메시지:', error.message);
      console.error('❌ 오류 스택:', error.stack);
      
      // Firebase 연결 오류인지 확인
      if (error.code === 'auth/network-request-failed') {
        console.error('🌐 네트워크 연결 오류 - 인터넷 연결을 확인하세요');
        Alert.alert('네트워크 오류', '인터넷 연결을 확인하고 다시 시도해주세요.');
        return true;
      } else if (error.code === 'auth/too-many-requests') {
        console.error('⏰ 너무 많은 요청 - 잠시 후 다시 시도하세요');
        Alert.alert('요청 제한', '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.');
        return true;
      }
      
      // 네트워크 오류나 다른 오류의 경우 true를 반환하여 회원가입을 막음
      return true;
    }
  };

  const handleNextStep = async () => {
    if (signupStep === 1) {
      if (!signupForm.name || !signupForm.email || !signupForm.password || !signupForm.confirmPassword) {
        Alert.alert('오류', '모든 필드를 입력해주세요.');
        return;
      }
      if (signupForm.password !== signupForm.confirmPassword) {
        Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
        return;
      }
      if (signupForm.password.length < 6) {
        Alert.alert('오류', '비밀번호는 최소 6자 이상이어야 합니다.');
        return;
      }
      
      // 이메일 중복 확인
      console.log('🚀 이메일 중복 확인 시작');
      try {
        const emailExists = await checkEmailExists(signupForm.email);
        console.log('📊 이메일 중복 결과:', emailExists);
        if (emailExists) {
          console.log('⚠️ 중복된 이메일 발견, 알림 표시');
          Alert.alert('오류', '이미 가입된 이메일입니다.');
          return;
        }
        console.log('✅ 이메일 중복 없음, 다음 단계로 진행');
      } catch (error) {
        console.error('❌ 이메일 중복 확인 실패:', error);
        Alert.alert('오류', '이메일 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
        return;
      }
    }
    
    if (signupStep === 3) {
      // Q3에서 아무것도 선택하지 않았을 때 처리
      if (!userPreferences.readingTime) {
        // 아무것도 선택하지 않았어도 다음 단계로 진행 가능
        console.log('⚠️ Q3에서 시간대를 선택하지 않음, 나중에 설정 가능');
      }
    }
    
    if (signupStep === 4) {
      // Q3에서 완료 버튼을 눌렀을 때 회원가입 완료
      handleSignup();
    } else if (signupStep < TOTAL_STEPS) {
      setSignupStep(signupStep + 1);
    } else {
      handleSignup();
    }
  };

  const handlePrevStep = () => {
    if (signupStep > 1) {
      setSignupStep(signupStep - 1);
    } else {
      // 로그인 화면으로 돌아갈 때 폼 초기화
      setSignupForm({ name: '', email: '', password: '', confirmPassword: '' });
      setSignupStep(1);
      setUserPreferences({
        interests: [],
        readingFrequency: '',
        readingTime: '',
        customTime: { hour: 8, minute: 0, period: 'AM' },
        notificationSettings: {
          morning: false,
          lunch: false,
          evening: false,
        },
      });
      setAuthState('login');
    }
  };

  const renderLoginForm = () => (
    <View style={styles.loginFormContainer}>
      <Text style={styles.title}>로그인</Text>
      <Text style={styles.subtitle}>SummaNews에 오신 것을 환영합니다</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="이메일"
          placeholderTextColor="#9CA3AF"
          value={loginForm.email}
          onChangeText={(email) => setLoginForm({ ...loginForm, email })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="비밀번호"
            placeholderTextColor="#9CA3AF"
            value={loginForm.password}
            onChangeText={(password) => setLoginForm({ ...loginForm, password })}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeButtonText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[styles.primaryButton, loading && styles.disabledButton]} 
        onPress={handleLogin}
        disabled={loading}
      >
        <LinearGradient
          colors={loading ? ['#9CA3AF', '#6B7280'] : ['#4F46E5', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientButton}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? '로그인 중...' : '로그인'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => {
          // 회원가입 화면으로 이동할 때 폼 초기화
          setSignupForm({ name: '', email: '', password: '', confirmPassword: '' });
          setSignupStep(1);
          setUserPreferences({
            interests: [],
            readingFrequency: '',
            readingTime: '',
            customTime: { hour: 8, minute: 0, period: 'AM' },
            notificationSettings: {
              morning: false,
              lunch: false,
              evening: false,
            },
          });
          setAuthState('signup');
        }}
      >
        <Text style={styles.secondaryButtonText}>
          계정이 없으신가요? <Text style={styles.linkText}>회원가입</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSignupStep = () => {
    switch(signupStep) {
      case 1:
        return renderBasicInfo();
      case 2:
        return renderQuestion1();
      case 3:
        return renderQuestion2();
      case 4:
        return renderQuestion3();
      case 5:
        return renderCustomTimeSettings();
      default:
        return null;
    }
  };

  const renderBasicInfo = () => (
    <>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="이름"
          placeholderTextColor="#9CA3AF"
          value={signupForm.name}
          onChangeText={(name) => setSignupForm({ ...signupForm, name })}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="이메일"
          placeholderTextColor="#9CA3AF"
          value={signupForm.email}
          onChangeText={(email) => setSignupForm({ ...signupForm, email })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="비밀번호 (6자 이상)"
            placeholderTextColor="#9CA3AF"
            value={signupForm.password}
            onChangeText={(password) => setSignupForm({ ...signupForm, password })}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeButtonText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="비밀번호 확인"
          placeholderTextColor="#9CA3AF"
          value={signupForm.confirmPassword}
          onChangeText={(confirmPassword) => setSignupForm({ ...signupForm, confirmPassword })}
          secureTextEntry={true}
        />
      </View>
    </>
  );

  const renderQuestion1 = () => (
    <View style={styles.questionSection}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionNumber}>Q1</Text>
        <Text style={styles.questionTitle}>관심있는 분야를 선택해주세요</Text>
        <Text style={styles.questionSubtitle}>(2개~4개)</Text>
      </View>
      
      <View style={styles.optionsGrid}>
        {['정치', '연예', '생활·문화', '경제', 'IT/과학', '세계', '스포츠', '환경'].map(interest => (
          <TouchableOpacity
            key={interest}
            style={[
              styles.optionButton,
              userPreferences.interests.includes(interest) && styles.optionButtonActive
            ]}
            onPress={() => {
              const newInterests = userPreferences.interests.includes(interest)
                ? userPreferences.interests.filter(i => i !== interest)
                : [...userPreferences.interests, interest];
              
              if (newInterests.length <= 4) {
                setUserPreferences({...userPreferences, interests: newInterests});
              }
            }}
          >
            <Text style={[
              styles.optionText,
              userPreferences.interests.includes(interest) && styles.optionTextActive
            ]}>{interest}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.questionFooter} />
    </View>
  );

  const renderQuestion2 = () => (
    <View style={styles.questionSection}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionNumber}>Q2</Text>
        <Text style={styles.questionTitle}>뉴스를 얼마나 자주 확인하시나요</Text>
        <Text style={styles.questionSubtitle}>선호하는 뉴스 확인 빈도를 선택해주세요</Text>
      </View>
      
      <View style={styles.optionsGrid}>
        {['매일', '주 3-4회', '주 1-2회', '가끔'].map(frequency => (
          <TouchableOpacity
            key={frequency}
            style={[
              styles.optionButton,
              userPreferences.readingFrequency === frequency && styles.optionButtonActive
            ]}
            onPress={() => setUserPreferences({...userPreferences, readingFrequency: frequency})}
          >
            <Text style={[
              styles.optionText,
              userPreferences.readingFrequency === frequency && styles.optionTextActive
            ]}>{frequency}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.questionFooter} />
    </View>
  );

  const renderQuestion3 = () => (
    <View style={styles.questionSection}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionNumber}>Q3</Text>
        <Text style={styles.questionTitle}>매일 뉴스를 볼 시간을 고르세요</Text>
        <Text style={styles.questionSubtitle}>원하는 뉴스 알림 시간대를 선택해주세요</Text>
      </View>
      
      <View style={styles.timeOptionsContainer}>
        <TouchableOpacity
          style={[styles.timeOption, userPreferences.readingTime === 'morning' && styles.timeOptionActive]}
          onPress={() => setUserPreferences({
            ...userPreferences, 
            readingTime: userPreferences.readingTime === 'morning' ? '' : 'morning'
          })}
        >
          <Text style={[
            styles.timeOptionLabel,
            userPreferences.readingTime === 'morning' && styles.timeOptionLabelActive
          ]}>출퇴근 루틴 (8:00/18:30)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.timeOption, userPreferences.readingTime === 'lunch' && styles.timeOptionActive]}
          onPress={() => setUserPreferences({
            ...userPreferences, 
            readingTime: userPreferences.readingTime === 'lunch' ? '' : 'lunch'
          })}
        >
          <Text style={[
            styles.timeOptionLabel,
            userPreferences.readingTime === 'lunch' && styles.timeOptionLabelActive
          ]}>식후 루틴 (12:30/19:30)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.timeOption, userPreferences.readingTime === 'evening' && styles.timeOptionActive]}
          onPress={() => setUserPreferences({
            ...userPreferences, 
            readingTime: userPreferences.readingTime === 'evening' ? '' : 'evening'
          })}
        >
          <Text style={[
            styles.timeOptionLabel,
            userPreferences.readingTime === 'evening' && styles.timeOptionLabelActive
          ]}>밤시간 루틴 (8:00/22:00)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => setSignupStep(5)}
        >
          <Text style={styles.skipButtonText}>직접 시간대 설정하기</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.questionFooter} />
    </View>
  );



  const renderCustomTimeSettings = () => (
    <View style={styles.questionSection}>
      <Text style={styles.questionTitle}>직접 알림 시간을 설정해주세요</Text>
      <Text style={styles.questionSubtitle}>원하는 뉴스 알림 시간을 직접 설정해주세요</Text>
      
      <View style={styles.timePickerContainer}>
        <View style={styles.timePickerSection}>
          <View style={styles.timePickerRow}>
            <Text style={styles.timePickerLabel}>시간:</Text>
            {/* 시간 선택 */}
            <View style={styles.timePicker}>
              <TouchableOpacity 
                style={styles.timePickerButton}
                onPress={() => {
                  const newHour = userPreferences.customTime.hour === 12 ? 1 : userPreferences.customTime.hour + 1;
                  setUserPreferences({
                    ...userPreferences,
                    customTime: { ...userPreferences.customTime, hour: newHour }
                  });
                }}
              >
                <Text style={styles.timePickerArrow}>▲</Text>
              </TouchableOpacity>
              <Text style={styles.timePickerValue}>{userPreferences.customTime.hour}</Text>
              <TouchableOpacity 
                style={styles.timePickerButton}
                onPress={() => {
                  const newHour = userPreferences.customTime.hour === 1 ? 12 : userPreferences.customTime.hour - 1;
                  setUserPreferences({
                    ...userPreferences,
                    customTime: { ...userPreferences.customTime, hour: newHour }
                  });
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
                  const newMinute = userPreferences.customTime.minute === 50 ? 0 : userPreferences.customTime.minute + 10;
                  setUserPreferences({
                    ...userPreferences,
                    customTime: { ...userPreferences.customTime, minute: newMinute }
                  });
                }}
              >
                <Text style={styles.timePickerArrow}>▲</Text>
              </TouchableOpacity>
              <Text style={styles.timePickerValue}>{userPreferences.customTime.minute.toString().padStart(2, '0')}</Text>
              <TouchableOpacity 
                style={styles.timePickerButton}
                onPress={() => {
                  const newMinute = userPreferences.customTime.minute === 0 ? 50 : userPreferences.customTime.minute - 10;
                  setUserPreferences({
                    ...userPreferences,
                    customTime: { ...userPreferences.customTime, minute: newMinute }
                  });
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
                  const newPeriod = userPreferences.customTime.period === 'AM' ? 'PM' : 'AM';
                  setUserPreferences({
                    ...userPreferences,
                    customTime: { ...userPreferences.customTime, period: newPeriod }
                  });
                }}
              >
                <Text style={styles.timePickerArrow}>▲</Text>
              </TouchableOpacity>
              <Text style={styles.timePickerValue}>{userPreferences.customTime.period}</Text>
              <TouchableOpacity 
                style={styles.timePickerButton}
                onPress={() => {
                  const newPeriod = userPreferences.customTime.period === 'AM' ? 'PM' : 'AM';
                  setUserPreferences({
                    ...userPreferences,
                    customTime: { ...userPreferences.customTime, period: newPeriod }
                  });
                }}
              >
                <Text style={styles.timePickerArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSignupForm = () => (
    <View style={styles.signupFormContainer}>
        {/* 헤더 섹션 */}
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={handlePrevStep} style={styles.backArrow}>
            <Text style={styles.backArrowText}>‹</Text>
          </TouchableOpacity>
          
          {signupStep === 1 && (
            <Text style={styles.stepTitle}>회원가입</Text>
          )}
        </View>
        
        {/* 컨텐츠 섹션 */}
        {renderSignupStep()}
        
        {/* Q3에서 다음 버튼 위에 안내 메시지 */}
        {signupStep === 4 && (
          <Text style={styles.skipMessage}>다음에 설정할 수 있습니다.</Text>
        )}
        
        {/* 버튼 섹션 */}
        <TouchableOpacity
          style={[
            styles.nextButton,
            (signupStep === TOTAL_STEPS || signupStep === 4) ? styles.completeButton : 
            (signupStep === 2 && userPreferences.interests.length < 2) ? styles.disabledButton : 
            styles.enabledButton
          ]}
          onPress={handleNextStep}
          disabled={signupStep === 2 && userPreferences.interests.length < 2}
        >
          <Text style={styles.nextButtonText}>
            {signupStep === TOTAL_STEPS || signupStep === 4 ? '완료' : '다음'}
          </Text>
        </TouchableOpacity>
      </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradient}
      >
        <View style={styles.scrollContent}>
          {authState === 'login' ? renderLoginForm() : renderSignupForm()}
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loginFormContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  signupFormContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backArrow: {
    marginRight: 15,
  },
  backArrowText: {
    fontSize: 30,
    color: '#374151',
  },
  stepTitle: {
    paddingTop: 10,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  questionNumberHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 30,
    textAlign: 'center',
  },
  questionSection: {
    height: 300,
    marginVertical: 0,
  },
  questionHeader: {
    paddingTop: 0,
    paddingBottom: 10,
    marginTop: -30,
  },
  questionFooter: {
    height: 40,
  },
  questionNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  questionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 0,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeButton: {
    padding: 15,
    paddingRight: 20,
  },
  eyeButtonText: {
    fontSize: 18,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    flex: 1,
    paddingTop: 0,
    paddingBottom: 5,
  },
  optionButton: {
    width: '48%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  optionText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timeOptionsContainer: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 5,
    justifyContent: 'flex-start',
  },
  timeOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timeOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  timeOptionLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  timeOptionLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  notificationContainer: {
    marginTop: 20,
  },
  notificationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
  },
  notificationOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#818CF8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  skipButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginTop: 10,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  skipMessage: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  nextButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#6B7280',
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  enabledButton: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButton: {
    backgroundColor: '#1F2937',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  primaryButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 15,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  linkText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  timePickerContainer: {
    marginTop: 30,
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
    marginRight: 20,
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
});

export default AuthScreen;
