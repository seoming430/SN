// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Auth와 Firestore 인스턴스 생성
export const auth = getAuth(app);
export const firestore = getFirestore(app);

export default app;