import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, Platform } from 'react-native';
import Tts from 'react-native-tts';
// import PushNotification from 'react-native-push-notification'; // 일시적으로 비활성화
import { auth, firestore } from '../firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // TTS 초기화
    Tts.setDefaultLanguage('ko-KR');
    Tts.setDefaultRate(0.5);
    
    // Push Notification 설정 (Android) - 일시적으로 비활성화
    // if (Platform.OS === 'android') {
    //   PushNotification.configure({
    //     onRegister: function (token) {
    //       console.log("TOKEN:", token);
    //     },
    //     onNotification: function (notification) {
    //       console.log("NOTIFICATION:", notification);
    //     },
    //     permissions: {
    //       alert: true,
    //       badge: true,
    //       sound: true,
    //     },
    //     popInitialNotification: true,
    //     requestPermissions: true,
    //   });
    // }
    
    // Auth 상태 변화 감지
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        loadUserData(user.uid);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const loadUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User data:', userData);
        // 여기서 사용자 데이터를 활용할 수 있습니다
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      // Firestore에 사용자 정보 저장
      await setDoc(doc(firestore, 'users', userCredential.user.uid), {
        name: name,
        email: email,
        createdAt: new Date(),
        preferences: {
          categories: [],
          notificationEnabled: false
        }
      });
      
      setMessage('회원가입 성공!');
      Tts.speak('회원가입이 완료되었습니다');
      
      // 알림 전송 - 일시적으로 비활성화
      // PushNotification.localNotification({
      //   title: "환영합니다!",
      //   message: "SummaNews 가입을 환영합니다",
      // });
    } catch (error) {
      setMessage('회원가입 실패: ' + error.message);
      Tts.speak('회원가입에 실패했습니다');
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage('로그인 성공!');
      Tts.speak('로그인 되었습니다');
      
      // 알림 전송 - 일시적으로 비활성화
      // PushNotification.localNotification({
      //   title: "로그인 성공",
      //   message: "오늘의 뉴스를 확인해보세요!",
      // });
    } catch (error) {
      setMessage('로그인 실패: ' + error.message);
      Tts.speak('로그인에 실패했습니다');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMessage('로그아웃 되었습니다');
      Tts.speak('로그아웃 되었습니다');
    } catch (error) {
      setMessage('로그아웃 실패: ' + error.message);
    }
  };

  const speakNews = (text) => {
    Tts.speak(text);
  };

  const stopSpeaking = () => {
    Tts.stop();
  };

  if (user) {
    return (
      <View style={{ padding: 20 }}>
        <Text>환영합니다, {user.displayName || user.email}님!</Text>
        <Button title="로그아웃" onPress={handleLogout} />
        <Text>{message}</Text>
        
        <View style={{ marginTop: 20 }}>
          <Text>뉴스 TTS 테스트</Text>
          <Button 
            title="뉴스 읽기" 
            onPress={() => speakNews('오늘의 주요 뉴스입니다. AI 기술이 빠르게 발전하고 있습니다.')} 
          />
          <Button title="정지" onPress={stopSpeaking} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text>{isLogin ? '로그인' : '회원가입'}</Text>
      
      {!isLogin && (
        <TextInput
          placeholder="이름"
          value={name}
          onChangeText={setName}
          style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
        />
      )}
      
      <TextInput
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      
      <TextInput
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      
      <Button
        title={isLogin ? '로그인' : '회원가입'}
        onPress={isLogin ? handleLogin : handleSignUp}
      />
      
      <Button
        title={isLogin ? '회원가입으로 전환' : '로그인으로 전환'}
        onPress={() => setIsLogin(!isLogin)}
      />
      
      <Text>{message}</Text>
    </View>
  );
}