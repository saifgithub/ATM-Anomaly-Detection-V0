import { useState, useEffect, createContext, useContext } from 'react';
import { User } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  role?: string;
  orgId?: string;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const MOCK_USER: AuthUser = {
  uid: 'mock-user-123',
  email: 'admin@example.com',
  displayName: 'Admin User',
  role: 'admin',
  orgId: 'org_123',
  emailVerified: true,
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDevelopment = process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'mock-api-key-for-development';
    
    if (isDevelopment) {
      setTimeout(() => {
        setUser(MOCK_USER);
        setLoading(false);
      }, 1000);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: userData.displayName || firebaseUser.displayName,
              role: userData.role,
              orgId: userData.orgId,
              emailVerified: firebaseUser.emailVerified,
            });
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              emailVerified: firebaseUser.emailVerified,
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            emailVerified: firebaseUser.emailVerified,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const isDevelopment = process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'mock-api-key-for-development';
    
    if (isDevelopment) {
      if (email === 'admin@example.com' && password === 'password') {
        setUser(MOCK_USER);
        return;
      } else {
        throw new Error('Invalid credentials. Use admin@example.com / password for development.');
      }
    }

    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    const isDevelopment = process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'mock-api-key-for-development';
    
    if (isDevelopment) {
      setUser(null);
      return;
    }

    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    login,
    logout,
  };
};

export { AuthContext };
