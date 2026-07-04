import {
  collection, addDoc, getDocs, updateDoc,
  query, where, orderBy, limit,
  serverTimestamp, writeBatch, doc,
} from "firebase/firestore";
import { db } from "../firebase/config";

const NOTIFS = "notifications";

// ── Create a notification ──
export async function createNotification(userId, data) {
  await addDoc(collection(db, NOTIFS), {
    userId,
    type:    data.type,     // quiz_result | achievement | streak | weekly | info
    title:   data.title,
    message: data.message,
    icon:    data.icon ?? "bell",
    read:    false,
    link:    data.link ?? null,
    createdAt: serverTimestamp(),
  });
}

// ── Get all notifications for a user ──
export async function getNotifications(userId, limitCount = 30) {
  const q = query(
    collection(db, NOTIFS),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── Get unread count ──
export async function getUnreadCount(userId) {
  const q = query(
    collection(db, NOTIFS),
    where("userId", "==", userId),
    where("read", "==", false)
  );
  const snap = await getDocs(q);
  return snap.size;
}

// ── Mark single notification as read ──
export async function markAsRead(notifId) {
  await updateDoc(doc(db, NOTIFS, notifId), { read: true });
}

// ── Mark all as read ──
export async function markAllAsRead(userId) {
  const q = query(
    collection(db, NOTIFS),
    where("userId", "==", userId),
    where("read", "==", false)
  );
  const snap = await getDocs(q);
  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.update(doc(db, NOTIFS, d.id), { read: true });
  });
  await batch.commit();
}

// ── Notification presets ──
export function quizResultNotif(deckTitle, score, total, pct) {
  const grade = pct >= 75 ? "Great job" : pct >= 50 ? "Good effort" : "Keep practicing";
  return {
    type:    "quiz_result",
    title:   "Quiz Complete!",
    message: `${grade}! You scored ${score}/${total} (${pct}%) on "${deckTitle}".`,
    icon:    "clipboard",
    link:    "/dashboard/progress",
  };
}

export function streakNotif(days) {
  return {
    type:    "streak",
    title:   `${days}-Day Streak! 🔥`,
    message: `Amazing! You've studied for ${days} days in a row. Keep it up!`,
    icon:    "flame",
    link:    "/dashboard/progress",
  };
}

export function welcomeNotif(username) {
  return {
    type:    "info",
    title:   `Welcome to BrainDeck, ${username}! 🎉`,
    message: "Start by creating your first deck and adding flashcards. Then take a quiz to test yourself!",
    icon:    "sparkles",
    link:    "/dashboard/decks",
  };
}
