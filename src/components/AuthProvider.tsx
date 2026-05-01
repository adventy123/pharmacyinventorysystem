import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db, getUserProfile, handleFirestoreError, OperationType } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  setRole: (role: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  signIn: async () => {},
  logOut: async () => {},
  setRole: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser);
          if (profile) {
            setUserRole(profile.role);
          } else {
            setUserRole('pending');
          }
          
          setUser(currentUser); // Set user only after role is known
          
          // Listen to role changes
          const unsubDoc = onSnapshot(doc(db, 'users', currentUser.uid), (doc) => {
            if (doc.exists()) {
              setUserRole(doc.data().role);
            }
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
          });
          setLoading(false);
          return () => unsubDoc();
        } catch (e: any) {
          console.error(e);
          alert(`Login failed during profile fetch: ${e.message || e}`);
          setUser(null);
          setUserRole(null);
          setLoading(false);
        }
      } else {
        setUserRole(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Error signing in:', error);
      alert(`Sign in failed: ${error.message || error}`);
    }
  };

  const logOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const setRole = (role: string) => {
    setUserRole(role);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, signIn, logOut, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};
