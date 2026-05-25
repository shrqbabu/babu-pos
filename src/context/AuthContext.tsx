// Authentication Context Provider - supports both Firebase and Demo mode
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserProfile } from '../firebase/auth';

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

interface AuthContextType {
  currentUser: UserProfile | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  isAdmin: false,
  isManager: false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

  const unsubscribe = onAuthStateChanged(auth, async (user) => {

    if (user) {

      const profile = await getUserProfile(user.uid);

      if (profile) {
        setUserProfile(profile);

      } else {

        // fallback profile
        setUserProfile({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Admin',
          role: 'admin',
          isActive: true,
          createdAt: new Date()
        });
      }

    } else {
      setUserProfile(null);
    }

    setLoading(false);
  });

  return () => unsubscribe();

}, []);

  const value: AuthContextType = {
    currentUser: userProfile,
    userProfile,
    loading,
    isAdmin: userProfile?.role === 'admin',
    isManager: userProfile?.role === 'admin' || userProfile?.role === 'manager'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
