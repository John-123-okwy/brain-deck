import { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import {
  doc, setDoc, getDoc, updateDoc, onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { getPlan } from "../config/PlanConfig";
import { createNotification, welcomeNotif } from "../services/notificationService";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading]         = useState(true);

  // Keep a ref to the active Firestore unsubscribe so we can
  // clean it up whenever the auth user changes
  const profileUnsub = useRef(null);

  // ── Sign up ──
  async function signup(email, password, username) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: username });

    await setDoc(doc(db, "users", result.user.uid), {
      uid:          result.user.uid,
      username,
      email,
      createdAt:    new Date().toISOString(),
      plan:         "free",
      aiCredits:    5,
      xp:           0,
      streak:       0,
      totalDecks:   0,
      quizzesTaken: 0,
      lastStudied:  null,
    });

    // Send welcome notification
    try {
      await createNotification(result.user.uid, welcomeNotif(username));
    } catch { /* non-blocking */ }

    return result;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function updateUserProfile(data) {
    if (!currentUser) return;
    await updateDoc(doc(db, "users", currentUser.uid), data);
  }

  function getUserPlan() {
    return getPlan(userProfile?.plan ?? "free");
  }

  function getCredits() {
    return userProfile?.aiCredits ?? 0;
  }

  function isPro() {
    return userProfile?.plan === "pro";
  }

  async function fetchUserProfile(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) setUserProfile(snap.data());
    return snap.data() ?? null;
  }

  async function refreshProfile() {
    if (!currentUser) return;
    await fetchUserProfile(currentUser.uid);
  }

  // ── Single useEffect handles BOTH auth + profile listener ──
  // This prevents the race condition between two separate effects
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {

      // 1. Cancel any existing Firestore profile listener
      if (profileUnsub.current) {
        profileUnsub.current();
        profileUnsub.current = null;
      }

      if (user) {
        // 2. Set the auth user
        setCurrentUser(user);

        // 3. Start a real-time listener on this user's Firestore profile
        //    onSnapshot fires immediately with current data, then again
        //    on every change — so aiCredits updates reflect instantly
        profileUnsub.current = onSnapshot(
          doc(db, "users", user.uid),
          (snap) => {
            if (snap.exists()) {
              setUserProfile(snap.data());
            }
            // Mark loading done after first snapshot
            setLoading(false);
          },
          (err) => {
            console.error("Profile listener error:", err);
            setLoading(false);
          }
        );
      } else {
        // 4. No user — clear everything
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    // Cleanup both listeners on unmount
    return () => {
      unsubscribeAuth();
      if (profileUnsub.current) {
        profileUnsub.current();
        profileUnsub.current = null;
      }
    };
  }, []); // ← empty array: runs once on mount only

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    resetPassword,
    fetchUserProfile,
    refreshProfile,
    updateUserProfile,
    getUserPlan,
    getCredits,
    isPro,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
