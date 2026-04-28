import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { type Auth, type Persistence, getAuth, initializeAuth } from 'firebase/auth';

// Replace with your Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyChNIZQEs_r0vDXNwbPm48Ptwc2KGa2r28",
  authDomain: "swapliy.firebaseapp.com",
  databaseURL: "https://swapliy-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "swapliy",
  storageBucket: "swapliy.firebasestorage.app",
  messagingSenderId: "969201981628",
  appId: "1:969201981628:web:daf7ebe57dfd2400b618b9",
  measurementId: "G-MGPZMB00KR"
};

// Initialize Firebase app only once (HMR-safe during development).
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// In React Native, use AsyncStorage persistence so auth survives app restarts.
let authInstance: Auth;
try {
  const maybeGetReactNativePersistence = (
    FirebaseAuth as unknown as {
      getReactNativePersistence?: (storage: unknown) => Persistence;
    }
  ).getReactNativePersistence;

  if (maybeGetReactNativePersistence) {
    authInstance = initializeAuth(app, {
      persistence: maybeGetReactNativePersistence(AsyncStorage),
    });
  } else {
    authInstance = getAuth(app);
  }
} catch {
  // initializeAuth throws if already initialized; reuse existing instance.
  authInstance = getAuth(app);
}
export const auth = authInstance;

export default app;
