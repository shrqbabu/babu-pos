// Firebase initialization for SmartPOS
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyA5aqIQNLAEuSWm5kaPNR7OiFTUQ66AOtI",
  authDomain: "juice-app-d5be7.firebaseapp.com",
  databaseURL: "https://juice-app-d5be7-default-rtdb.firebaseio.com",
  projectId: "juice-app-d5be7",
  storageBucket: "juice-app-d5be7.firebasestorage.app",
  messagingSenderId: "767495141095",
  appId: "1:767495141095:web:1b0bcc822e3144a0a69442",
  measurementId: "G-GJG4BWDF1M",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
