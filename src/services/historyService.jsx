import {
  collection, addDoc, getDocs,
  query, where, orderBy, limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

const STUDY_HISTORY = "studyHistory";

// ── Save a study session ──
export async function saveStudySession(userId, data) {
  await addDoc(collection(db, STUDY_HISTORY), {
    userId,
    deckId:      data.deckId,
    deckTitle:   data.deckTitle,
    cardCount:   data.cardCount,
    knownCount:  data.knownCount,
    learningCount: data.learningCount,
    duration:    data.duration,   // seconds
    type:        data.type ?? "flashcard", // flashcard | course
    courseTitle: data.courseTitle ?? null,
    createdAt:   serverTimestamp(),
  });
}

// ── Get study history ──
export async function getStudyHistory(userId, limitCount = 50) {
  const q = query(
    collection(db, STUDY_HISTORY),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── Get quiz history (reuse from quizService) ──
export { getQuizHistory } from "./quizService";
