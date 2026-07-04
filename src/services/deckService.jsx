import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { updateStatsAfterDeckCreated } from "./gamificationService";

const DECKS = "decks";

// Create a new deck
export async function createDeck(userId, data) {
  const ref = await addDoc(collection(db, DECKS), {
    userId,
    title: data.title,
    description: data.description || "",
    subject: data.subject || "General",
    color: data.color || "purple",
    cardCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  // Update stats + check achievements (non-blocking)
  try { await updateStatsAfterDeckCreated(userId); } catch {}
  return ref.id;
}

// Get all decks for a user
export async function getUserDecks(userId) {
  const q = query(
    collection(db, DECKS),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Get single deck
export async function getDeck(deckId) {
  const snap = await getDoc(doc(db, DECKS, deckId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// Update deck
export async function updateDeck(deckId, data) {
  await updateDoc(doc(db, DECKS, deckId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// Delete deck
export async function deleteDeck(deckId) {
  await deleteDoc(doc(db, DECKS, deckId));
}
