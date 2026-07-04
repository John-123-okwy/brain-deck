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
import { updateStatsAfterCourseCreated } from "./gamificationService";

const COURSES = "courses";

// Create course
export async function createCourse(userId, data) {
  const ref = await addDoc(collection(db, COURSES), {
    userId,
    title:       data.title,
    description: data.description || "",
    subject:     data.subject || "General",
    color:       data.color || "purple",
    deckIds:     [],
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
  });
  // Update stats + check achievements (non-blocking)
  try { await updateStatsAfterCourseCreated(userId); } catch {}
  return ref.id;
}

// Get all courses for a user
export async function getUserCourses(userId) {
  const q = query(
    collection(db, COURSES),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Get single course
export async function getCourse(courseId) {
  const snap = await getDoc(doc(db, COURSES, courseId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// Update course metadata
export async function updateCourse(courseId, data) {
  await updateDoc(doc(db, COURSES, courseId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// Add deck to course
export async function addDeckToCourse(courseId, deckId, currentDeckIds) {
  if (currentDeckIds.includes(deckId)) return;
  await updateDoc(doc(db, COURSES, courseId), {
    deckIds:   [...currentDeckIds, deckId],
    updatedAt: serverTimestamp(),
  });
}

// Remove deck from course
export async function removeDeckFromCourse(courseId, deckId, currentDeckIds) {
  await updateDoc(doc(db, COURSES, courseId), {
    deckIds:   currentDeckIds.filter((id) => id !== deckId),
    updatedAt: serverTimestamp(),
  });
}

// Delete course
export async function deleteCourse(courseId) {
  await deleteDoc(doc(db, COURSES, courseId));
}
