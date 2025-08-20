// components/AuthComponents.tsx
import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { AuthState, LoginCredentials, SignupCredentials } from '../types/auth';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    age: '',
    interests: [] as string[],
    readingTime: '',
    newsFrequency: ''
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      // 로그인 상태를 AsyncStorage에 저장
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userEmail', loginForm.email);
      Alert.alert('로그인 성공', '환영합니다!', [{ text: '확인', onPress: onAuthSuccess }]);
    } catch (error: any) {
      let errorMessage = '로그인에 실패했습니다.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = '등록되지 않은 이메일입니다.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '비밀번호가 올바르지 않습니다.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '올바르지 않은 이메일 형식입니다.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
      }
      Alert.alert('로그인 오류', errorMessage);
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!signupForm.name || !signupForm.email || !signupForm.password) {
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
    
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupForm.email, signupForm.password);
      await updateProfile(userCredential.user, {
        displayName: signupForm.name
      });
      
      // 사용자 추가 정보 저장 (실제로는 서버나 AsyncStorage에 저장)
      console.log('User preferences:', userPreferences);
      
      // 회원가입 성공 시 자동 로그인 상태로 전환
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userEmail', signupForm.email);
      Alert.alert('회원가입 성공', '가입이 완료되었습니다!', [
        { text: '확인', onPress: onAuthSuccess }
      ]);
    } catch (error: any) {
      let errorMessage = '회원가입에 실패했습니다.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일입니다.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '올바르지 않은 이메일 형식입니다.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.';
      }
      Alert.alert('회원가입 오류', errorMessage);
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = () => (
    <View style={styles.formContainer}>
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
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          placeholderTextColor="#9CA3AF"
          value={loginForm.password}
          onChangeText={(password) => setLoginForm({ ...loginForm, password })}
          secureTextEntry
        />
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
        onPress={() => setAuthState('signup')}
      >
        <Text style={styles.secondaryButtonText}>
          계정이 없으신가요? <Text style={styles.linkText}>회원가입</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  const handleNextStep = () => {
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
      setSignupStep(2);
    }
  };

  const handleInterestToggle = (interest: string) => {
    setUserPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const renderSignupForm = () => (
    <View style={styles.formContainer}>
      {/* 뒤로가기 버튼 */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => signupStep === 1 ? setAuthState('login') : setSignupStep(1)}
      >
        <Text style={styles.backButtonText}>‹ {signupStep === 1 ? '로그인으로 돌아가기' : '이전 단계'}</Text>
      </TouchableOpacity>
      
      {/* 진행 표시 */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, signupStep >= 1 && styles.progressDotActive]} />
        <View style={[styles.progressLine, signupStep >= 2 && styles.progressLineActive]} />
        <View style={[styles.progressDot, signupStep >= 2 && styles.progressDotActive]} />
      </View>
      
      <Text style={styles.title}>{signupStep === 1 ? '회원가입' : '맞춤 설정'}</Text>
      <Text style={styles.subtitle}>
        {signupStep === 1 ? '새로운 계정을 만들어보세요' : '당신만을 위한 뉴스를 준비해드릴게요'}
      </Text>
      
      {signupStep === 1 ? (
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
            <TextInput
              style={styles.input}
              placeholder="비밀번호 (6자 이상)"
              placeholderTextColor="#9CA3AF"
              value={signupForm.password}
              onChangeText={(password) => setSignupForm({ ...signupForm, password })}
              secureTextEntry
            />
            <Text style={styles.inputHint}>안전한 비밀번호를 사용해주세요</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="비밀번호 확인"
              placeholderTextColor="#9CA3AF"
              value={signupForm.confirmPassword}
              onChangeText={(confirmPassword) => setSignupForm({ ...signupForm, confirmPassword })}
              secureTextEntry
            />
          </View>
        </>
      ) : (
        <>
          {/* Step 2: 추가 정보 */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionLabel}>연령대를 선택해주세요</Text>
            <View style={styles.optionsRow}>
              {['10대', '20대', '30대', '40대', '50대', '60대 이상'].map(age => (
                <TouchableOpacity
                  key={age}
                  style={[
                    styles.optionButton,
                    userPreferences.age === age && styles.optionButtonActive
                  ]}
                  onPress={() => setUserPreferences({...userPreferences, age})}
                >
                  <Text style={[
                    styles.optionText,
                    userPreferences.age === age && styles.optionTextActive
                  ]}>{age}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.questionContainer}>
            <Text style={styles.questionLabel}>관심 분야를 선택해주세요 (복수 선택 가능)</Text>
            <View style={styles.optionsGrid}>
              {['정치', '경제', '사회', '문화', '스포츠', 'IT/과학', '국제', '연예'].map(interest => (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.optionButton,
                    userPreferences.interests.includes(interest) && styles.optionButtonActive
                  ]}
                  onPress={() => handleInterestToggle(interest)}
                >
                  <Text style={[
                    styles.optionText,
                    userPreferences.interests.includes(interest) && styles.optionTextActive
                  ]}>{interest}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.questionContainer}>
            <Text style={styles.questionLabel}>하루 뉴스 읽기 시간</Text>
            <View style={styles.optionsRow}>
              {['5분', '10분', '30분', '1시간 이상'].map(time => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.optionButton,
                    userPreferences.readingTime === time && styles.optionButtonActive
                  ]}
                  onPress={() => setUserPreferences({...userPreferences, readingTime: time})}
                >
                  <Text style={[
                    styles.optionText,
                    userPreferences.readingTime === time && styles.optionTextActive
                  ]}>{time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}
      
      <TouchableOpacity 
        style={[styles.primaryButton, loading && styles.disabledButton]} 
        onPress={signupStep === 1 ? handleNextStep : handleSignup}
        disabled={loading}
      >
        <LinearGradient
          colors={loading ? ['#9CA3AF', '#6B7280'] : signupStep === 1 ? ['#4F46E5', '#7C3AED'] : ['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientButton}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? '처리 중...' : signupStep === 1 ? '다음 단계' : '회원가입 완료'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
      
      {signupStep === 1 && (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setAuthState('login')}
        >
          <Text style={styles.secondaryButtonText}>
            이미 계정이 있으신가요? <Text style={styles.linkText}>로그인</Text>
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <LinearGradient
      colors={['#667EEA', '#764BA2']}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>📰</Text>
          <Text style={styles.logoText}>SummaNews</Text>
          <Text style={styles.logoSubtext}>AI가 요약해주는 스마트한 뉴스</Text>
        </View>
        
        {authState === 'login' ? renderLoginForm() : renderSignupForm()}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 64,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  logoSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  primaryButton: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  linkText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  // 새로운 스타일들
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
  },
  backButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: '#4F46E5',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#4F46E5',
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    marginLeft: 4,
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  optionButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  optionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  optionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});