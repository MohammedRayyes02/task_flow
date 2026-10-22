import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA6b_XmwVwpGSwa1oqfQAys-cO6KJCaRTc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "task-flow-52e7e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "task-flow-52e7e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "task-flow-52e7e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "970143708603",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:970143708603:web:ac919f9b9c049cc0d0009e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-0FCTDCLVKK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
