import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase config. Fill these in with your own free Firebase project
 * (Firebase console -> Project settings -> General -> Your apps -> Web app).
 * Firestore is what makes a booking made by a client show up instantly on
 * the trainer's phone, and vice versa. Without a real project this falls
 * back to a stub key so the app still boots for local UI development.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "REPLACE_ME",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "REPLACE_ME",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "REPLACE_ME",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "REPLACE_ME",
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_SENDER_ID ?? "REPLACE_ME",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "REPLACE_ME",
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const db = getFirestore(firebaseApp);
