// Firebase Configuration for SmartPOS
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA5aqIQNLAEuSWm5kaPNR7OiFTUQ66AOtI",
  authDomain: "juice-app-d5be7.firebaseapp.com",
  projectId: "juice-app-d5be7",
  storageBucket: "juice-app-d5be7.firebasestorage.app",
  messagingSenderId: "767495141095",
  appId: "1:767495141095:web:1b0bcc822e3144a0a69442"
};

// Duplicate init se bachao
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ✅ FIX: enableIndexedDbPersistence deprecated hai Firebase v9.20+ mein
// Ab initializeFirestore ke saath cache use hota hai — yeh code hata diya
// Agar chahiye toh: import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'

export default app;
