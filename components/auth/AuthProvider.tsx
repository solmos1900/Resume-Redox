"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  verifyPasswordResetCode,
  type User,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  verifyResetCode: (oobCode: string) => Promise<string>;
  confirmReset: (oobCode: string, newPassword: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      configured: isFirebaseConfigured,

      signInWithGoogle: async () => {
        if (!auth || !googleProvider) throw new Error("Sign-in is not configured.");
        await signInWithPopup(auth, googleProvider);
      },

      signInWithEmail: async (email, password) => {
        if (!auth) throw new Error("Sign-in is not configured.");
        await signInWithEmailAndPassword(auth, email, password);
      },

      signUpWithEmail: async (email, password, displayName) => {
        if (!auth) throw new Error("Sign-in is not configured.");
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        if (displayName.trim()) {
          await updateProfile(credential.user, {
            displayName: displayName.trim(),
          });
          // onAuthStateChanged doesn't re-fire for profile-only updates, so
          // force a re-render with a fresh reference carrying the new name.
          setUser({ ...credential.user } as User);
        }
      },

      sendPasswordReset: async (email) => {
        if (!auth) throw new Error("Sign-in is not configured.");
        await sendPasswordResetEmail(auth, email, {
          url: `${window.location.origin}/auth/action`,
          handleCodeInApp: true,
        });
      },

      verifyResetCode: async (oobCode) => {
        if (!auth) throw new Error("Sign-in is not configured.");
        return verifyPasswordResetCode(auth, oobCode);
      },

      confirmReset: async (oobCode, newPassword) => {
        if (!auth) throw new Error("Sign-in is not configured.");
        await confirmPasswordReset(auth, oobCode, newPassword);
      },

      signOutUser: async () => {
        if (!auth) return;
        await signOut(auth);
      },
    }),
    [user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
