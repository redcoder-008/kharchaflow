import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  onAuthStateChanged 
} from "firebase/auth";
import { auth, googleProvider, hasValidConfig } from "../db/firebase";
import { localDB } from "../db/storage";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(() => {
    // Default to demo mode if there is no valid Firebase config, or if localStorage has demo mode set to true
    if (!hasValidConfig) return true;
    return localDB.getIsDemoMode();
  });

  // Track Firebase state if config is valid and not running in demo mode
  useEffect(() => {
    if (!hasValidConfig || isDemoMode) {
      // Demo Mode Authentication Setup
      const savedProfile = localDB.getProfile();
      const demoUser = localStorage.getItem("kharchaflow_demo_active_user");
      if (demoUser) {
        setUser(JSON.parse(demoUser));
      } else {
        // Auto log in with seeded profile for rich out-of-the-box demo experience
        const defaultUser = {
          uid: "demo-user-123",
          email: savedProfile.email,
          displayName: savedProfile.displayName,
          photoURL: null,
          isAnonymous: false
        };
        localStorage.setItem("kharchaflow_demo_active_user", JSON.stringify(defaultUser));
        setUser(defaultUser);
      }
      setLoading(false);
      return;
    }

    // Live Firebase Authentication Listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || "Fintech User",
          photoURL: firebaseUser.photoURL,
          isAnonymous: firebaseUser.isAnonymous
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Auth state listener error: ", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoMode]);

  // Auth Operations
  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      if (isDemoMode) {
        // Simulate local latency
        await new Promise((res) => setTimeout(res, 800));
        
        // Simple demo authentication checks
        const savedProfile = localDB.getProfile();
        const demoUser = {
          uid: "demo-user-123",
          email: email.toLowerCase(),
          displayName: email.toLowerCase() === savedProfile.email.toLowerCase() ? savedProfile.displayName : "Demo User",
          photoURL: null
        };
        
        localStorage.setItem("kharchaflow_demo_active_user", JSON.stringify(demoUser));
        setUser(demoUser);
        setLoading(false);
        return true;
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setLoading(false);
        return userCredential.user;
      }
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
      setLoading(false);
      throw err;
    }
  };

  const register = async (email, password, displayName) => {
    setError(null);
    setLoading(true);
    try {
      if (isDemoMode) {
        await new Promise((res) => setTimeout(res, 1000));
        
        const newProfile = { displayName, email, photoURL: null };
        localDB.saveProfile(newProfile);
        
        const demoUser = {
          uid: "demo-user-" + Math.random().toString(36).substring(2, 9),
          email: email.toLowerCase(),
          displayName: displayName,
          photoURL: null
        };
        
        localStorage.setItem("kharchaflow_demo_active_user", JSON.stringify(demoUser));
        setUser(demoUser);
        setLoading(false);
        return true;
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await firebaseUpdateProfile(userCredential.user, { displayName });
        setUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: displayName,
          photoURL: null
        });
        setLoading(false);
        return userCredential.user;
      }
    } catch (err) {
      setError(err.message || "Failed to register account.");
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    setLoading(true);
    try {
      if (isDemoMode) {
        await new Promise((res) => setTimeout(res, 500));
        localStorage.removeItem("kharchaflow_demo_active_user");
        setUser(null);
        setLoading(false);
        return true;
      } else {
        await signOut(auth);
        setUser(null);
        setLoading(false);
        return true;
      }
    } catch (err) {
      setError(err.message || "Failed to sign out.");
      setLoading(false);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      if (isDemoMode) {
        await new Promise((res) => setTimeout(res, 1000));
        const demoUser = {
          uid: "demo-google-user-789",
          email: "google.karan@kharchaflow.com",
          displayName: "Karan (Google)",
          photoURL: "https://lh3.googleusercontent.com/a/default-user=s96-c"
        };
        localStorage.setItem("kharchaflow_demo_active_user", JSON.stringify(demoUser));
        localDB.saveProfile({
          displayName: demoUser.displayName,
          email: demoUser.email,
          photoURL: demoUser.photoURL
        });
        setUser(demoUser);
        setLoading(false);
        return true;
      } else {
        if (!hasValidConfig) throw new Error("Firebase config not found.");
        const result = await signInWithPopup(auth, googleProvider);
        setLoading(false);
        return result.user;
      }
    } catch (err) {
      setError(err.message || "Failed to sign in with Google.");
      setLoading(false);
      throw err;
    }
  };

  const resetPassword = async (email) => {
    setError(null);
    try {
      if (isDemoMode) {
        await new Promise((res) => setTimeout(res, 600));
        // Mock password reset email success
        return true;
      } else {
        await sendPasswordResetEmail(auth, email);
        return true;
      }
    } catch (err) {
      setError(err.message || "Failed to send reset link.");
      throw err;
    }
  };

  const updateProfileName = async (newDisplayName) => {
    setError(null);
    try {
      if (isDemoMode) {
        const savedProfile = localDB.getProfile();
        const updated = { ...savedProfile, displayName: newDisplayName };
        localDB.saveProfile(updated);
        
        const updatedUser = { ...user, displayName: newDisplayName };
        localStorage.setItem("kharchaflow_demo_active_user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        return true;
      } else {
        if (auth.currentUser) {
          await firebaseUpdateProfile(auth.currentUser, { displayName: newDisplayName });
          setUser(prev => ({ ...prev, displayName: newDisplayName }));
          return true;
        }
      }
    } catch (err) {
      setError(err.message || "Failed to update profile name.");
      throw err;
    }
  };

  const toggleDemoMode = (val) => {
    if (!hasValidConfig && !val) {
      alert("No valid Firebase credentials configured. Setup your Firebase keys in settings first.");
      return;
    }
    localDB.setIsDemoMode(val);
    setIsDemoMode(val);
    localStorage.removeItem("kharchaflow_demo_active_user");
    setUser(null);
    // clean context reload
    window.location.reload();
  };

  const value = {
    user,
    loading,
    error,
    isDemoMode,
    login,
    register,
    logout,
    signInWithGoogle,
    resetPassword,
    updateProfileName,
    toggleDemoMode
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
