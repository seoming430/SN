// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA5Qbhbp-GGtS4NYqOagk6LOvd1YNQomww",
  authDomain: "myexpoappproject.firebaseapp.com",
  projectId: "myexpoappproject",
  storageBucket: "myexpoappproject.firebasestorage.app",
  messagingSenderId: "333093931095",
  appId: "1:333093931095:web:103f792053903fbe5efb12"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

export default app;