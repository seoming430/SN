import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
import Tts from 'react-native-tts';

export default function SimpleHome() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // TTS 초기화
    Tts.setDefaultLanguage('ko-KR');
    Tts.setDefaultRate(0.5);
  }, []);

  const handleSignUp = () => {
    if (!name || !email || !password) {
      setMessage('모든 필드를 입력해주세요');
      Tts.speak('모든 필드를 입력해주세요');
      return;
    }
    
    setMessage('회원가입 성공!');
    Tts.speak('회원가입이 완료되었습니다');
    setIsLogin(true);
    Alert.alert('성공', '회원가입이 완료되었습니다!');
  };

  const handleLogin = () => {
    if (!email || !password) {
      setMessage('이메일과 비밀번호를 입력해주세요');
      Tts.speak('이메일과 비밀번호를 입력해주세요');
      return;
    }
    
    setIsLoggedIn(true);
    setMessage('로그인 성공!');
    Tts.speak('로그인 되었습니다');
    Alert.alert('성공', '로그인이 완료되었습니다!');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setMessage('로그아웃 되었습니다');
    Tts.speak('로그아웃 되었습니다');
    Alert.alert('로그아웃', '로그아웃 되었습니다');
  };

  const speakNews = (text) => {
    Tts.speak(text);
  };

  const stopSpeaking = () => {
    Tts.stop();
  };

  if (isLoggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>SummaNews 📰</Text>
        <Text style={styles.welcome}>환영합니다, {email}님!</Text>
        
        <View style={styles.newsSection}>
          <Text style={styles.sectionTitle}>뉴스 TTS 테스트</Text>
          <Button 
            title="🔊 오늘의 뉴스 듣기" 
            onPress={() => speakNews('안녕하세요! 오늘의 주요 뉴스입니다. AI 기술이 빠르게 발전하고 있으며, 새로운 뉴스 요약 서비스가 출시되었습니다.')} 
          />
          <View style={styles.buttonSpace} />
          <Button title="⏹️ 정지" onPress={stopSpeaking} />
        </View>
        
        <View style={styles.buttonSpace} />
        <Button title="로그아웃" onPress={handleLogout} color="#FF6B6B" />
        
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SummaNews 📰</Text>
      <Text style={styles.subtitle}>{isLogin ? '로그인' : '회원가입'}</Text>
      
      {!isLogin && (
        <TextInput
          placeholder="이름"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
      )}
      
      <TextInput
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      
      <TextInput
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      
      <View style={styles.buttonSpace} />
      
      <Button
        title={isLogin ? '로그인' : '회원가입'}
        onPress={isLogin ? handleLogin : handleSignUp}
        color="#4A4DFF"
      />
      
      <View style={styles.buttonSpace} />
      
      <Button
        title={isLogin ? '회원가입으로 전환' : '로그인으로 전환'}
        onPress={() => setIsLogin(!isLogin)}
        color="#6B7280"
      />
      
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A4DFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 30,
  },
  welcome: {
    fontSize: 20,
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  newsSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 15,
    textAlign: 'center',
  },
  buttonSpace: {
    height: 10,
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    color: '#10B981',
    textAlign: 'center',
    fontWeight: '500',
  },
});