import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";

export function useCredits() {
  const { currentUser, userProfile, isPro } = useAuth();
  const [upgradeOpen, setUpgradeOpen]       = useState(false);

  const credits    = userProfile?.aiCredits ?? 0;
  const pro        = isPro();
  const hasCredits = pro || credits > 0;

  // Spends 1 credit directly — no external service dependency
  async function spendCredit(reason = "ai_generation") {
    // Pro users always pass
    if (pro) return true;

    // No user logged in
    if (!currentUser?.uid) {
      console.error("spendCredit: no currentUser");
      return false;
    }

    // Check credits from Firestore directly (not cached state)
    // to avoid stale reads
    const snap = await getDoc(doc(db, "users", currentUser.uid));
    if (!snap.exists()) {
      console.error("spendCredit: user doc not found");
      return false;
    }

    const freshCredits = snap.data().aiCredits ?? 0;
    console.log("spendCredit: freshCredits =", freshCredits);

    if (freshCredits <= 0) {
      setUpgradeOpen(true);
      return false;
    }

    // Deduct directly here
    await updateDoc(doc(db, "users", currentUser.uid), {
      aiCredits: increment(-1),
    });

    console.log("spendCredit: deducted 1 credit successfully");
    // onSnapshot in AuthContext will update the badge automatically
    return true;
  }

  return {
    credits,
    hasCredits,
    isPro: pro,
    spendCredit,
    upgradeOpen,
    setUpgradeOpen,
  };
}
