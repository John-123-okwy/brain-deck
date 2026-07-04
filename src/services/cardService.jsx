import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { updateDeck } from "./deckService";

const CARDS = (deckId) => `decks/${deckId}/cards`;

// Add card
export async function addCard(deckId, data) {
  const ref = await addDoc(collection(db, CARDS(deckId)), {
    front: data.front,
    back: data.back,
    createdAt: serverTimestamp(),
  });
  // keep cardCount in sync
  const all = await getCards(deckId);
  await updateDeck(deckId, { cardCount: all.length });
  return ref.id;
}

// Get all cards
export async function getCards(deckId) {
  const q = query(collection(db, CARDS(deckId)), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Update card
export async function updateCard(deckId, cardId, data) {
  await updateDoc(doc(db, CARDS(deckId), cardId), {
    front: data.front,
    back: data.back,
    updatedAt: serverTimestamp(),
  });
}

// Delete card
export async function deleteCard(deckId, cardId) {
  await deleteDoc(doc(db, CARDS(deckId), cardId));
  const remaining = await getCards(deckId);
  await updateDeck(deckId, { cardCount: remaining.length });
}
