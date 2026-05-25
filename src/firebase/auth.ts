// Firebase Authentication utilities for SmartPOS
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { Collections } from './firestore';

// ─── Auth Types ───────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'cashier' | 'manager';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  storeId?: string;
  isActive: boolean;
  createdAt?: any;
}

// ─── Sign In ──────────────────────────────────────────────────────────────────
export const signIn = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const userData = await getUserData(credential.user.uid);
  return { user: credential.user, userData };
};

// ─── Sign Up ──────────────────────────────────────────────────────────────────
export const signUp = async (
  email: string,
  password: string,
  displayName: string,
  role: UserRole = 'cashier'
) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update display name
  await updateProfile(credential.user, { displayName });
  
  // Save user data to Firestore
  const userData: AppUser = {
    uid: credential.user.uid,
    email,
    displayName,
    role,
    isActive: true,
  };
  
  await setDoc(doc(db, Collections.USERS, credential.user.uid), {
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return { user: credential.user, userData };
};

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export const logOut = async () => {
  await signOut(auth);
};

// ─── Get User Data ────────────────────────────────────────────────────────────
export const getUserData = async (uid: string): Promise<AppUser | null> => {
  const docRef = doc(db, Collections.USERS, uid);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { uid, ...snapshot.data() } as AppUser;
  }
  return null;
};

// ─── Auth State Observer ──────────────────────────────────────────────────────
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// ─── Create Demo Admin ────────────────────────────────────────────────────────
export const createDemoAdmin = async () => {
  try {
    const result = await signUp('admin@smartpos.com', 'admin123456', 'Admin User', 'admin');
    return result;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      return null; // Admin already exists
    }
    throw error;
  }
};
