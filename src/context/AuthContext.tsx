// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User
} from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const googleLogin = () =>
    signInWithPopup(auth, new GoogleAuthProvider());

  const emailLogin = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

  const emailSignup = (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{ user, loading, googleLogin, emailLogin, emailSignup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
