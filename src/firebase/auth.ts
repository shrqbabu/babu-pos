// Firebase Authentication Service
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'cashier' | 'manager';
  storeId?: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: any;
  lastLogin?: any;
}

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<UserProfile> => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  
  // Update last login
  await setDoc(doc(db, 'users', result.user.uid), {
    lastLogin: serverTimestamp()
  }, { merge: true });

  const profile = await getUserProfile(result.user.uid);
  if (!profile) {
  return {
    uid: result.user.uid,
    email: result.user.email || '',
    displayName: result.user.displayName || 'Admin',
    role: 'admin',
    isActive: true,
    createdAt: new Date()
  } as UserProfile;
}
};

// Create new user account
export const createUser = async (
  email: string,
  password: string,
  userData: Omit<UserProfile, 'uid' | 'createdAt'>
): Promise<UserProfile> => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  
  await updateProfile(result.user, { displayName: userData.displayName });
  
  const profile: UserProfile = {
    ...userData,
    uid: result.user.uid,
    createdAt: serverTimestamp()
  };
  
  await setDoc(doc(db, 'users', result.user.uid), profile);
  return profile;
};

// Get user profile from Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docSnap = await getDoc(doc(db, 'users', uid));
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

// Sign out
export const logOut = () => signOut(auth);

// Password reset
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

// Auth state observer
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { auth };
