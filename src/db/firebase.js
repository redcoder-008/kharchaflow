import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { localDB } from "./storage";
import { TestTube } from "lucide-react";

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

const savedConfig = localDB.getFirebaseConfig();

// Default keys from environment variables or custom config saved in LocalStorage
const firebaseConfig = savedConfig || {
  apiKey:  "AIzaSyAKrp8hmewhlIY0lOa_hDE6h7BRJrSaadc",
  authDomain: "kharchaflow-878a7.firebaseapp.com",
  projectId: "kharchaflow-878a7",
  storageBucket: "kharchaflow-878a7.firebasestorage.app",
  messagingSenderId: "676021776006",
  appId:"1:676021776006:web:a903d852f85e93deaa2b07"
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
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.error("Firebase initialization failed: ", error);
  }
}

export { app, auth, db, googleProvider, hasValidConfig };
export function reloadFirebaseApp(newConfig) {
  if (newConfig) {
    localDB.saveFirebaseConfig(newConfig);
  } else {
    localDB.saveFirebaseConfig(null);
  }
  // Fast window reload ensures clean re-initialization of the React environment
  window.location.reload();
}
