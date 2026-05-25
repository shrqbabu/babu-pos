// Authentication Context for SmartPOS
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, getUserData, AppUser } from '../firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  userData: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userData: null,
  loading: true,
  isAdmin: false,
  isManager: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        const data = await getUserData(user.uid);
        setUserData(data);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const isAdmin = userData?.role === 'admin';
  const isManager = userData?.role === 'manager' || isAdmin;

  return (
    <AuthContext.Provider value={{ currentUser, userData, loading, isAdmin, isManager }}>
      {children}
    </AuthContext.Provider>
  );
};
