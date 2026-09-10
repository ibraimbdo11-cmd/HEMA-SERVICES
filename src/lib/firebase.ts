import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyBmnITA-r_suNZYLboEuToiJkGmDhVh9CQ",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "hema-services-1ffb7.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "hema-services-1ffb7",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "hema-services-1ffb7.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "411758609965",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:411758609965:web:e8f3b02fbd82d9142e9aa4",
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || "G-F7TBPKWX69",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fbSignOut,
  sendPasswordResetEmail,
  updateProfile,
};
