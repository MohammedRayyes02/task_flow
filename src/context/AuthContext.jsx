/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/config/Firebase";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid, fallbackEmail) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userSnapshot = await getDoc(userDocRef);
      if (userSnapshot.exists()) {
        const data = userSnapshot.data();
        setUserProfile({
          id: userSnapshot.id,
          fullName: data.fullName || fallbackEmail?.split("@")[0] || "User",
          email: data.email || fallbackEmail || "",
          role: data.role || "User",
          createdAt: data.createdAt || null,
        });
      } else {
        setUserProfile({
          id: uid,
          fullName: fallbackEmail?.split("@")[0] || "User",
          email: fallbackEmail || "",
          role: "User",
          createdAt: null,
        });
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setUserProfile({
        id: uid,
        fullName: fallbackEmail?.split("@")[0] || "User",
        email: fallbackEmail || "",
        role: "User",
        createdAt: null,
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid, user.email);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await fetchUserProfile(cred.user.uid, cred.user.email);
    return cred.user;
  };

  const registerUser = async (email, password, fullName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    await setDoc(doc(db, "users", user.uid), {
      fullName,
      email,
      role: "User",
      createdAt: serverTimestamp(),
    });

    setUserProfile({
      id: user.uid,
      fullName,
      email,
      role: "User",
      createdAt: new Date(),
    });

    return user;
  };

  const logout = () => {
    return signOut(auth);
  };

  const updateUserProfileData = async ({ fullName }) => {
    if (!currentUser) throw new Error("No authenticated user.");
    if (!fullName || fullName.trim().length < 2) {
      throw new Error("Full name must be at least 2 characters.");
    }

    const cleanName = fullName.trim();
    const userDocRef = doc(db, "users", currentUser.uid);
    await updateDoc(userDocRef, {
      fullName: cleanName,
      updatedAt: serverTimestamp(),
    });

    try {
      await updateProfile(currentUser, { displayName: cleanName });
    } catch (err) {
      console.warn("Could not update auth displayName:", err);
    }

    setUserProfile((prev) => (prev ? { ...prev, fullName: cleanName } : null));
  };

  const deleteUserAccount = async (currentPassword) => {
    if (!currentUser) throw new Error("No authenticated user.");

    // Re-authenticate if password is provided
    if (currentPassword) {
      const cred = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, cred);
    }

    const uid = currentUser.uid;

    // 1. Delete user profile doc from Firestore
    await deleteDoc(doc(db, "users", uid));

    // 2. Delete user from Firebase Auth
    await deleteUser(currentUser);

    // 3. Clear local state
    setCurrentUser(null);
    setUserProfile(null);
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    registerUser,
    logout,
    updateUserProfileData,
    deleteUserAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
