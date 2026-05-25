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

export const signIn = async (
  email: string,
  password: string
): Promise<UserProfile> => {
  
  // Step 1: Sirf login karo pehle
  const result = await signInWithEmailAndPassword(auth, email, password);

  // Step 2: Auth fully settle hone ka wait karo
  await auth.authStateReady();

  // Step 3: Profile fetch karo
  const profile = await getUserProfile(result.user.uid);

  // Step 4: lastLogin background mein update karo - await mat karo
  // Ye fail ho bhi jaye to login nahi rukna chahiye
  setDoc(doc(db, 'users', result.user.uid), {
    lastLogin: serverTimestamp()
  }, { merge: true }).catch(err => {
    console.warn('lastLogin update failed:', err);
  });

  if (!profile) {
    const fallback: UserProfile = {
      uid: result.user.uid,
      email: result.user.email || '',
      displayName: result.user.displayName || 'Admin',
      role: 'admin',
      isActive: true,
      createdAt: new Date()
    };
    return fallback;
  }

  return profile;
};

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

export const getUserProfile = async (
  uid: string
): Promise<UserProfile | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.warn('getUserProfile error:', err);
    return null;
  }
};

export const logOut = () => signOut(auth);
export const resetPassword = (email: string) => 
  sendPasswordResetEmail(auth, email);
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { auth };
