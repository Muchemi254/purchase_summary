import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase';

interface AuthContextType {
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Load user profile from Firestore
        const profileDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (profileDoc.exists()) {
          setUserProfile(profileDoc.data());
        } else {
          // Create default profile
          const defaultProfile = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email?.split('@')[0],
            createdAt: Date.now(),
            preferences: {
              currency: 'KES',
              dateFormat: 'DD/MM/YYYY',
              defaultPaymentMode: 'cash',
              enableNotifications: true
            }
          };
          await setDoc(doc(firestore, 'users', user.uid), defaultProfile);
          setUserProfile(defaultProfile);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signupWithEmail = async (email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile
    await setDoc(doc(firestore, 'users', result.user.uid), {
      uid: result.user.uid,
      email: result.user.email,
      name: result.user.email?.split('@')[0],
      createdAt: Date.now(),
      preferences: {
        currency: 'KES',
        dateFormat: 'DD/MM/YYYY',
        defaultPaymentMode: 'cash',
        enableNotifications: true
      }
    });
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Check if profile exists
    const profileDoc = await getDoc(doc(firestore, 'users', result.user.uid));
    if (!profileDoc.exists()) {
      await setDoc(doc(firestore, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        name: result.user.displayName,
        photoURL: result.user.photoURL,
        createdAt: Date.now(),
        preferences: {
          currency: 'KES',
          dateFormat: 'DD/MM/YYYY',
          defaultPaymentMode: 'cash',
          enableNotifications: true
        }
      });
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const updateProfile = async (data: any) => {
    if (!user) throw new Error('Not authenticated');
    
    await setDoc(doc(firestore, 'users', user.uid), data, { merge: true });
    setUserProfile({ ...userProfile, ...data });
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      loginWithEmail,
      signupWithEmail,
      loginWithGoogle,
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}