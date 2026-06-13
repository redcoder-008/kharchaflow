import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { localDB } from "./storage";
import { TestTube } from "lucide-react";

let app = null;
let auth = null;
let db = null;
let googleProvider = null;
let storage = null;

const savedConfig = localDB.getFirebaseConfig();

// Default keys from environment variables or custom config saved in LocalStorage
const firebaseConfig = savedConfig || {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};


const hasValidConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

if (hasValidConfig) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Enable offline persistence
    enableIndexedDbPersistence(db).catch((err) => {
      console.warn("Failed to enable offline persistence: ", err.code);
    });

    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.error("Firebase initialization failed: ", error);
  }
}

export { app, auth, db, googleProvider, storage, hasValidConfig };
export function reloadFirebaseApp(newConfig) {
  if (newConfig) {
    localDB.saveFirebaseConfig(newConfig);
  } else {
    localDB.saveFirebaseConfig(null);
  }
  // Fast window reload ensures clean re-initialization of the React environment
  window.location.reload();
}
