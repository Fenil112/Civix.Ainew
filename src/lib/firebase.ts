// Firebase Configuration
// Replace these values with your actual Firebase project config
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDzeUoFxUV7mgP2QOu9WXMaXqPo0mOwP1Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "civixs-ai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "civixs-ai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "civixs-ai.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "859616892305",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:859616892305:web:467ebd3ad9dfd7225f7630",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Messaging (optional - only supported in browser environments)
export const getMessagingInstance = async () => {
  const supported = await isSupported();
  if (supported) {
    return getMessaging(app);
  }
  return null;
};

export default app;
