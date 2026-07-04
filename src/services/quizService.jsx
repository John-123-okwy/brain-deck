import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

const QUIZ_HISTORY = "quizHistory";

// ── Generate questions from a combined card pool ──
// Each card carries a deckId and deckTitle so results can be broken down per deck
export function generateQuestions(cards, count, types) {
  if (cards.length < 2) return [];

  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((card) => {
    const type = types[Math.floor(Math.random() * types.length)];

    if (type === "truefalse") {
      const isTrue = Math.random() > 0.5;
      let displayBack = card.back;

      if (!isTrue) {
        const others = cards.filter((c) => c.id !== card.id);
        const wrong  = others[Math.floor(Math.random() * others.length)];
        displayBack  = wrong.back;
      }

      return {
        id:            card.id,
        deckId:        card.deckId,
        deckTitle:     card.deckTitle,
        type:          "truefalse",
        question:      card.front,
        statement:     displayBack,
        correctAnswer: isTrue ? "True" : "False",
        options:       ["True", "False"],
        correctFront:  card.front,
        correctBack:   card.back,
      };
    }

    // Multiple choice — 1 correct + 3 wrong from the full pool
    const others = cards
      .filter((c) => c.id !== card.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const wrongOptions = others.map((c) => c.back);
    const allOptions   = [...wrongOptions, card.back].sort(() => Math.random() - 0.5);

    return {
      id:            card.id,
      deckId:        card.deckId,
      deckTitle:     card.deckTitle,
      type:          "multiplechoice",
      question:      card.front,
      correctAnswer: card.back,
      options:       allOptions,
      correctFront:  card.front,
      correctBack:   card.back,
    };
  });
}

// ── Save quiz result ──
// Now supports multiple deckIds for multi-deck sessions
export async function saveQuizResult(userId, data) {
  await addDoc(collection(db, QUIZ_HISTORY), {
    userId,
    deckId:    data.deckId    ?? null,   // null for multi-deck
    deckIds:   data.deckIds   ?? [],     // all deck ids involved
    deckTitle: data.deckTitle ?? "Quiz",
    score:     data.score,
    total:     data.total,
    percentage: data.percentage,
    timeTaken: data.timeTaken,
    createdAt: serverTimestamp(),
  });
}

// ── Get quiz history for user ──
export async function getQuizHistory(userId) {
  const q = query(
    collection(db, QUIZ_HISTORY),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
