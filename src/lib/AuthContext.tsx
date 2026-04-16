import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { toast } from 'sonner';

export type UserRole = 'author' | 'reviewer' | 'editor' | 'admin' | 'subscribed_reader' | 'unsubscribed_reader' | 'institutional';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  affiliation?: string;
  specialties?: string[];
  createdAt: string;
  bookmarkedArticles?: string[];
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isDemoMode: boolean;
  signInWithGoogle: () => Promise<void>;
  loginAsDemoUser: (role: UserRole) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isDemoMode: false,
  signInWithGoogle: async () => {},
  loginAsDemoUser: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check for demo mode first
    const demo = localStorage.getItem('demoMode') === 'true';
    if (demo) {
      const role = (localStorage.getItem('demoRole') as UserRole) || 'admin';
      const displayName = `Demo ${role.replace('_', ' ')}`;
      setIsDemoMode(true);
      setUser({ uid: `demo-${role}`, email: `${role}@demo.umaj.org`, displayName } as FirebaseUser);
      setProfile({
        uid: `demo-${role}`,
        email: `${role}@demo.umaj.org`,
        displayName,
        role: role,
        createdAt: new Date().toISOString()
      });
      setLoading(false);
      return;
    }

    let profileUnsubscribe: () => void;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          
          profileUnsubscribe = onSnapshot(userDocRef, async (userDoc) => {
            if (userDoc.exists()) {
              setProfile(userDoc.data() as UserProfile);
            } else {
              // Create default profile for new users
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'Anonymous User',
                photoURL: firebaseUser.photoURL || undefined,
                role: 'author', // Default role
                createdAt: new Date().toISOString(),
              };
              await setDoc(userDocRef, newProfile);
              setProfile(newProfile);
            }
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          });
          
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setProfile(null);
        if (profileUnsubscribe) profileUnsubscribe();
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        toast.info('Sign-in was cancelled.');
      } else {
        console.error('Error signing in with Google', error);
        toast.error('Error signing in with Google.');
      }
    }
  };

  const loginAsDemoUser = (role: UserRole) => {
    localStorage.setItem('demoMode', 'true');
    localStorage.setItem('demoRole', role);
    window.location.href = '/dashboard';
  };

  const signOutUser = async () => {
    if (localStorage.getItem('demoMode') === 'true') {
      localStorage.removeItem('demoMode');
      localStorage.removeItem('demoRole');
      window.location.href = '/';
      return;
    }
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isDemoMode, signInWithGoogle, loginAsDemoUser, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
