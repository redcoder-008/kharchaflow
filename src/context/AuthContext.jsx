import { createContext, useContext, useState, useEffect, useRef } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  updatePassword,
  deleteUser,
  onAuthStateChanged,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db, googleProvider, hasValidConfig } from "../db/firebase";
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
  if (!hasValidConfig) return true;
    const savedDemoMode = localStorage.getItem("kharchaflow_demo_mode");
    if (savedDemoMode === null) {
      // Default to Live cloud sync mode when a valid Firebase configuration is predefined
      return false;
    }
    return savedDemoMode === "true";
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
          isAnonymous: false,
          isAdmin: true,
          phone: "",
          language: "en"
        };
        localStorage.setItem("kharchaflow_demo_active_user", JSON.stringify(defaultUser));
        setUser(defaultUser);
      }
      setLoading(false);
      return;
    }

    // Live Firebase Authentication Listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let isAdmin = false;
        let phone = "";
        let language = "en";
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            // Default admin flag from Firestore
            isAdmin = data.isAdmin === true;
            // Override admin for specific email
            if (firebaseUser.email?.toLowerCase() === "redcoder008@gmail.com") {
              isAdmin = true;
            }
            phone = data.phone || "";
            language = data.language || "en";
          }
        } catch (err) {
          console.error("Failed to fetch user role: ", err);
        }
        // Ensure admin override for specific email even if user document does not exist
        if (firebaseUser.email?.toLowerCase() === "redcoder008@gmail.com") {
          isAdmin = true;
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || "Fintech User",
          photoURL: firebaseUser.photoURL,
          isAnonymous: firebaseUser.isAnonymous,
          isAdmin,
          phone,
          language
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
      // Force exit demo/offline mode if we have a valid live Firebase config
      if (hasValidConfig && isDemoMode) {
        localDB.setIsDemoMode(false);
        setIsDemoMode(false);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setLoading(false);
        return userCredential.user;
      }

      if (isDemoMode) {
        // Simple demo authentication checks
        const savedProfile = localDB.getProfile();
        const demoUser = {
          uid: "demo-user-123",
          email: email.toLowerCase(),
          displayName: email.toLowerCase() === savedProfile.email.toLowerCase() ? savedProfile.displayName : "Demo User",
          photoURL: null,
          isAdmin: true
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
      // Force exit demo/offline mode if we have a valid live Firebase config
      if (hasValidConfig && isDemoMode) {
        localDB.setIsDemoMode(false);
        setIsDemoMode(false);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await firebaseUpdateProfile(userCredential.user, { displayName });
        
        const userDocRef = doc(db, "users", userCredential.user.uid);
        await setDoc(userDocRef, {
          email: email.toLowerCase(),
          displayName,
          budgets: localDB.getDefaultBudgets(),
          initialBalances: localDB.getDefaultInitialBalances(),
          isAdmin: false
        });

        setUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: displayName,
          photoURL: null
        });
        setLoading(false);
        return userCredential.user;
      }

      if (isDemoMode) {
        const newProfile = { displayName, email, photoURL: null };
        localDB.saveProfile(newProfile);
        
        const demoUser = {
          uid: "demo-user-" + Math.random().toString(36).substring(2, 9),
          email: email.toLowerCase(),
          displayName: displayName,
          photoURL: null,
          isAdmin: true
        };
        
        localStorage.setItem("kharchaflow_demo_active_user", JSON.stringify(demoUser));
        setUser(demoUser);
        setLoading(false);
        return true;
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await firebaseUpdateProfile(userCredential.user, { displayName });
        
        const userDocRef = doc(db, "users", userCredential.user.uid);
        await setDoc(userDocRef, {
          email: email.toLowerCase(),
          displayName,
          budgets: localDB.getDefaultBudgets(),
          initialBalances: localDB.getDefaultInitialBalances(),
          isAdmin: false
        });

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
      // Clear all guest/demo transactions, budgets, initial balances, and profiles on logout
      localDB.resetAllData();
      localStorage.removeItem("kharchaflow_demo_active_user");

      if (isDemoMode) {
        if (hasValidConfig) {
          localDB.setIsDemoMode(false);
          setIsDemoMode(false);
        }
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
      // Force exit demo/offline mode if we have a valid live Firebase config
      if (hasValidConfig && isDemoMode) {
        localDB.setIsDemoMode(false);
        setIsDemoMode(false);
        const result = await signInWithPopup(auth, googleProvider);
        
        const userDocRef = doc(db, "users", result.user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            email: result.user.email?.toLowerCase() || "",
            displayName: result.user.displayName || "Fintech User",
            budgets: localDB.getDefaultBudgets(),
            initialBalances: localDB.getDefaultInitialBalances(),
            isAdmin: false
          });
        }
        
        setLoading(false);
        return result.user;
      }

      if (isDemoMode) {
        const demoUser = {
          uid: "demo-google-user-789",
          email: "google.yourname@kharchaflow.com",
          displayName: "Your Name (Google)",
          photoURL: "https://lh3.googleusercontent.com/a/default-user=s96-c",
          isAdmin: true
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
        
        const userDocRef = doc(db, "users", result.user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            email: result.user.email?.toLowerCase() || "",
            displayName: result.user.displayName || "Fintech User",
            budgets: localDB.getDefaultBudgets(),
            initialBalances: localDB.getDefaultInitialBalances(),
            isAdmin: false
          });
        }
        
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

  const updateUserProfile = async (data) => {
    setError(null);
    try {
      if (isDemoMode) {
        const savedProfile = localDB.getProfile();
        const updatedProfile = { ...savedProfile, ...data };
        localDB.saveProfile(updatedProfile);
        
        const updatedUser = { ...user, ...data };
        localStorage.setItem("kharchaflow_demo_active_user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        return true;
      } else {
        if (auth.currentUser) {
          const promises = [];
          const authUpdates = {};
          if (data.displayName !== undefined) authUpdates.displayName = data.displayName;
          if (data.photoURL !== undefined) authUpdates.photoURL = data.photoURL;
          
          if (Object.keys(authUpdates).length > 0) {
            promises.push(firebaseUpdateProfile(auth.currentUser, authUpdates));
          }

          const docUpdates = {};
          if (data.phone !== undefined) docUpdates.phone = data.phone;
          if (data.language !== undefined) docUpdates.language = data.language;
          if (data.displayName !== undefined) docUpdates.displayName = data.displayName;
          if (data.photoURL !== undefined) docUpdates.photoURL = data.photoURL;
          
          if (Object.keys(docUpdates).length > 0) {
            const userDocRef = doc(db, "users", auth.currentUser.uid);
            promises.push(updateDoc(userDocRef, docUpdates));
          }
          
          await Promise.all(promises);
          setUser(prev => ({ ...prev, ...data }));
          return true;
        }
      }
    } catch (err) {
      setError(err.message || "Failed to update profile.");
      throw err;
    }
  };

  const updateUserPassword = async (newPassword) => {
    setError(null);
    try {
      if (isDemoMode) return true;
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        return true;
      }
    } catch (err) {
      setError(err.message || "Failed to update password.");
      throw err;
    }
  };

  const deleteUserAccount = async () => {
    setError(null);
    try {
      if (isDemoMode) {
        localStorage.removeItem("kharchaflow_demo_active_user");
        setUser(null);
        return true;
      } else {
        if (auth.currentUser) {
          const uid = auth.currentUser.uid;
          await deleteDoc(doc(db, "users", uid));
          await deleteUser(auth.currentUser);
          setUser(null);
          return true;
        }
      }
    } catch (err) {
      setError(err.message || "Failed to delete account.");
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
    localDB.resetAllData(); // Wipe all local data when toggling demo mode to prevent merging
    setUser(null);
    // clean context reload
    window.location.reload();
  };

  // ── Phone Auth ─────────────────────────────────────────────────────────────
  const recaptchaVerifierRef = useRef(null);

  const setupRecaptcha = (containerId) => {
    if (!hasValidConfig || isDemoMode) return null;
    try {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, containerId, {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => {
          recaptchaVerifierRef.current = null;
        }
      });
      return recaptchaVerifierRef.current;
    } catch (err) {
      console.error("Recaptcha setup failed:", err);
      return null;
    }
  };

  const sendPhoneOTP = async (phoneNumber, containerId) => {
    setError(null);
    try {
      // Force exit demo/offline mode if we have a valid live Firebase config
      if (hasValidConfig && isDemoMode) {
        localDB.setIsDemoMode(false);
        setIsDemoMode(false);
      }

      if (isDemoMode) {
        // Demo: simulate OTP sent
        return { verificationId: "demo-verification-id" };
      }
      const verifier = setupRecaptcha(containerId);
      if (!verifier) throw new Error("reCAPTCHA setup failed.");
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      return confirmationResult;
    } catch (err) {
      setError(err.message || "Failed to send OTP.");
      throw err;
    }
  };

  const confirmPhoneOTP = async (confirmationResult, otp, displayName) => {
    setError(null);
    setLoading(true);
    try {
      if (isDemoMode || (confirmationResult && confirmationResult.verificationId === "demo-verification-id")) {
        if (otp !== "123456") throw new Error("Demo OTP is 123456.");
        const phoneUser = {
          uid: "demo-phone-user-" + Math.random().toString(36).substring(2, 7),
          email: "",
          displayName: displayName || "Phone User",
          photoURL: null,
          isAdmin: false
        };
        localStorage.setItem("kharchaflow_demo_active_user", JSON.stringify(phoneUser));
        setUser(phoneUser);
        setLoading(false);
        return true;
      }
      const result = await confirmationResult.confirm(otp);
      const firebaseUser = result.user;
      if (displayName) {
        await firebaseUpdateProfile(firebaseUser, { displayName });
      }
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: firebaseUser.email?.toLowerCase() || "",
          displayName: displayName || firebaseUser.displayName || "Phone User",
          phone: firebaseUser.phoneNumber || "",
          budgets: localDB.getDefaultBudgets(),
          initialBalances: localDB.getDefaultInitialBalances(),
          isAdmin: false
        });
      }
      setLoading(false);
      return result.user;
    } catch (err) {
      setError(err.message || "Invalid OTP. Please try again.");
      setLoading(false);
      throw err;
    }
  };

  const signInAsGuest = () => {
    // Enable demo mode
    localDB.setIsDemoMode(true);
    setIsDemoMode(true);
    
    // Seed default guest/demo user
    const savedProfile = localDB.getProfile();
    const guestUser = {
      uid: "guest-user-" + Math.random().toString(36).substring(2, 9),
      email: savedProfile.email || "guest@kharchaflow.com",
      displayName: savedProfile.displayName || "Guest User",
      photoURL: null,
      isAnonymous: true,
      isAdmin: false,
      phone: "",
      language: "en"
    };
    
    localStorage.setItem("kharchaflow_demo_active_user", JSON.stringify(guestUser));
    
    // Seed realistic dummy data for guest demo mode
    localDB.seedDummyData();
    
    setUser(guestUser);
    return guestUser;
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
    updateUserProfile,
    updateUserPassword,
    deleteUserAccount,
    toggleDemoMode,
    sendPhoneOTP,
    confirmPhoneOTP,
    signInAsGuest
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
