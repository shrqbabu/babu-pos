import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import type { AppUser, Role } from "../types";

interface Ctx {
  user: User | null;
  profile: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<Ctx>({
  user: null, profile: null, loading: true,
  login: async () => {}, register: async () => {}, logout: async () => {},
});

export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists()) {
            setProfile({ uid: u.uid, ...(snap.data() as Omit<AppUser, "uid">) });
          } else {
            // Auto-create profile (first user becomes admin)
            const newProfile: Omit<AppUser, "uid"> = {
              email: u.email || "",
              name: u.displayName || u.email?.split("@")[0] || "User",
              role: "admin",
              active: true,
              createdAt: Date.now(),
            };
            await setDoc(doc(db, "users", u.uid), { ...newProfile, serverCreated: serverTimestamp() });
            setProfile({ uid: u.uid, ...newProfile });
          }
        } catch (e) {
          console.error("profile fetch failed", e);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, name: string, role: Role) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      email, name, role, active: true, createdAt: Date.now(),
    });
  };

  const logout = async () => { await signOut(auth); };

  return (
    <AuthCtx.Provider value={{ user, profile, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
