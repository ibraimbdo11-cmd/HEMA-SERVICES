import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, fbSignOut } from '../lib/firebase';
import { api, setApiAuth, clearApiAuth } from '../lib/api';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  isLoggingOut: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const syncBackendUser = async (user: FirebaseUser) => {
    try {
      const userEmail = user.email || '';
      const userName = user.displayName || user.email?.split('@')[0] || 'مستخدم';
      const token = await user.getIdToken();
      setApiAuth(user.uid, userEmail, token);
      const userProfile = await api.syncUser({
        id: user.uid,
        name: userName,
        email: userEmail,
        photo: user.photoURL || undefined,
      });
      setProfile(userProfile);
    } catch (err) {
      console.error('Error syncing user with backend:', err);
      // Safe fallback local profile if backend is temporarily unreachable: default to 'user'
      const userEmail = user.email || '';
      const userName = user.displayName || user.email?.split('@')[0] || 'مستخدم';
      setProfile({
        id: user.uid,
        name: userName,
        email: userEmail,
        photo: user.photoURL || undefined,
        role: 'user',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncBackendUser(user);
      } else {
        setProfile(null);
        clearApiAuth();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const cleanEmail = email.trim();
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    if (cred.user) {
      await syncBackendUser(cred.user);
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    const cleanEmail = email.trim();
    const cleanName = name.trim();
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: cleanName });
      await syncBackendUser(cred.user);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        await syncBackendUser(cred.user);
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        // User voluntarily closed the popup without signing in - handle cleanly
        return;
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      setIsLoggingOut(true);
      clearApiAuth();
      await api.logoutSession();
      await fbSignOut(auth);
      setCurrentUser(null);
      setProfile(null);
    } finally {
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 150);
    }
  };

  const resetPassword = async (email: string) => {
    const cleanEmail = email.trim();
    await sendPasswordResetEmail(auth, cleanEmail);
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await syncBackendUser(currentUser);
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        isAdmin,
        loading,
        isLoggingOut,
        login,
        register,
        loginWithGoogle,
        logout,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
