import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User, Auth } from "firebase/auth";
import { toast } from 'sonner';

// Firebase Configuration
// Vite exposes env variables via import.meta.env and requires VITE_ prefix
const env = import.meta.env;

if (import.meta.env.DEV) {
  console.log(" Firebase env check (dev only)");
  console.log("VITE_FIREBASE_API_KEY set:", Boolean(env?.VITE_FIREBASE_API_KEY));
  console.log("VITE_FIREBASE_AUTH_DOMAIN set:", Boolean(env?.VITE_FIREBASE_AUTH_DOMAIN));
  console.log("VITE_FIREBASE_PROJECT_ID set:", Boolean(env?.VITE_FIREBASE_PROJECT_ID));
  console.log("VITE_FIREBASE_STORAGE_BUCKET set:", Boolean(env?.VITE_FIREBASE_STORAGE_BUCKET));
  console.log("VITE_FIREBASE_MESSAGING_SENDER_ID set:", Boolean(env?.VITE_FIREBASE_MESSAGING_SENDER_ID));
  console.log("VITE_FIREBASE_APP_ID set:", Boolean(env?.VITE_FIREBASE_APP_ID));
}

const firebaseConfig = {
  apiKey: env?.VITE_FIREBASE_API_KEY,
  authDomain: env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env?.VITE_FIREBASE_APP_ID
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;

// Initialize Firebase safely
// Check for missing configuration keys
const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingKeys = requiredKeys.filter(key => !env?.[key]);

if (missingKeys.length > 0) {
  if (import.meta.env.DEV) {
    console.warn(" Firebase 설정 누락:", missingKeys);
    console.warn(" 다음 환경변수들을 .env 파일에 추가해주세요:");
    missingKeys.forEach(key => {
      console.warn(`   ${key}=your_value_here`);
    });
    console.warn(" Firebase Console: https://console.firebase.google.com/");
  } else {
    console.error("Firebase 설정이 누락되어 초기화에 실패했습니다.");
  }
} else {
  try {
    // Prevent double initialization
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    if (import.meta.env.DEV) {
      console.log(" Firebase 초기화 성공!");
    }
  } catch (error) {
    console.error(" Firebase 초기화 실패:", error);
  }
}

export { app, auth, googleProvider };

// Auth Functions
export const loginWithGoogle = async (): Promise<User | null> => {
  if (!auth || !googleProvider) {
    toast.error("Firebase 설정이 필요합니다.", {
      description: ".env 파일에 VITE_FIREBASE_... 설정을 확인해주세요."
    });
    console.warn("Firebase is not initialized.");
    return null;
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Login Error:", error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
    throw error;
  }
};
