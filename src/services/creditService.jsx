import {
  doc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
  collection,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

// ── Deduct 1 credit — returns true if successful, false if insufficient ──
/*export async function deductCredit(userId, amount = 1, reason = "ai_generation") {
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (!snap.exists()) return false;

    const current = snap.data().aiCredits ?? 0;
    if (current < amount) return false;

    // Deduct from user profile
    await updateDoc(doc(db, "users", userId), {
      aiCredits: increment(-amount),
    });

    // Log usage — wrapped in try/catch so it never blocks the deduction
    try {
      await addDoc(collection(db, "creditUsage"), {
        userId,
        amount:    -amount,
        reason,
        createdAt: serverTimestamp(),
      });
    } catch (logErr) {
      // Non-critical — log fails silently, deduction already succeeded
      console.warn("Credit log failed (non-critical):", logErr.message);
    }

    return true;
  } catch (err) {
    console.error("deductCredit error:", err.message);
    return false;
  }
}*/

export async function deductCredit(userId, amount = 1, reason = "ai_generation") {
  try {
    console.log("1. deductCredit start — userId:", userId);

    const snap = await getDoc(doc(db, "users", userId));
    console.log("2. doc exists:", snap.exists());
    console.log("3. current aiCredits:", snap.data()?.aiCredits);

    if (!snap.exists()) return false;

    const current = snap.data().aiCredits ?? 0;
    if (current < amount) {
      console.log("4. blocked — not enough credits");
      return false;
    }

    await updateDoc(doc(db, "users", userId), {
      aiCredits: increment(-amount),
    });
    console.log("5. updateDoc done — should be", current - amount, "now");

    return true;
  } catch (err) {
    console.error("deductCredit THREW:", err.message);
    return false;
  }
}

// ── Get current credit balance ──
export async function getCreditBalance(userId) {
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return 0;
  return snap.data().aiCredits ?? 0;
}

// ── Add credits ──
export async function addCredits(userId, amount, reason = "purchase") {
  await updateDoc(doc(db, "users", userId), {
    aiCredits: increment(amount),
  });

  try {
    await addDoc(collection(db, "creditUsage"), {
      userId, amount, reason,
      createdAt: serverTimestamp(),
    });
  } catch (logErr) {
    console.warn("Credit log failed:", logErr.message);
  }
}

// ── Upgrade plan ──
export async function upgradePlan(userId, plan = "pro") {
  await updateDoc(doc(db, "users", userId), {
    plan,
    aiCredits:      50,
    planUpgradedAt: serverTimestamp(),
    planExpiresAt:  null,
  });
}

// ── Downgrade plan ──
export async function downgradePlan(userId) {
  await updateDoc(doc(db, "users", userId), {
    plan:      "free",
    aiCredits: 0,
  });
}


/*
export async function deductCredit(userId, amount = 1, reason = "ai_generation") {
  try {
    console.log("1. deductCredit start — userId:", userId);

    const snap = await getDoc(doc(db, "users", userId));
    console.log("2. doc exists:", snap.exists());
    console.log("3. current aiCredits:", snap.data()?.aiCredits);

    if (!snap.exists()) return false;

    const current = snap.data().aiCredits ?? 0;
    if (current < amount) {
      console.log("4. blocked — not enough credits");
      return false;
    }

    await updateDoc(doc(db, "users", userId), {
      aiCredits: increment(-amount),
    });
    console.log("5. updateDoc done — should be", current - amount, "now");

    return true;
  } catch (err) {
    console.error("deductCredit THREW:", err.message);
    return false;
  }
}*/