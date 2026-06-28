import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import type { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role?: UserRole, phone?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          uid,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const profile = await fetchUserProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const createUserProfile = async (
    uid: string,
    email: string,
    displayName: string,
    role: UserRole = 'citizen',
    phone: string = '',
    photoURL?: string
  ) => {
    const profile: Omit<UserProfile, 'uid'> = {
      email,
      displayName,
      fullName: displayName,
      phone,
      photoURL: photoURL || '',
      role,
      language: 'en',
      notificationsEnabled: true,
      emailNotifications: true,
      smsNotifications: false,
      profilePrivacy: 'public',
      communityScore: 0,
      totalComplaints: 0,
      resolvedComplaints: 0,
      badges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: false,
      isBanned: false,
    };

    await setDoc(doc(db, 'users', uid), {
      ...profile,
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return profile;
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: UserRole = 'citizen',
    phone: string = ''
  ) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(newUser, { displayName: name });
    await sendEmailVerification(newUser);
    const profile = await createUserProfile(newUser.uid, email, name, role, phone);
    setUserProfile({ uid: newUser.uid, ...profile } as UserProfile);
  };

  const signInWithGoogle = async () => {
    const { user: googleUser } = await signInWithPopup(auth, googleProvider);
    const existingProfile = await fetchUserProfile(googleUser.uid);
    if (!existingProfile) {
      const profile = await createUserProfile(
        googleUser.uid,
        googleUser.email!,
        googleUser.displayName!,
        'citizen',
        googleUser.photoURL || undefined
      );
      setUserProfile({ uid: googleUser.uid, ...profile } as UserProfile);
    } else {
      setUserProfile(existingProfile);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.uid);
      setUserProfile(profile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        logout,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
