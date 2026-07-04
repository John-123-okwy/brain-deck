import {
  doc, updateDoc, getDoc,
  collection, addDoc, getDocs,
  query, where, increment, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { ACHIEVEMENTS, XP_VALUES, getLevelInfo } from "../config/gamificationConfig";
import { createNotification } from "./notificationService";

// ── Award XP to user ──
export async function awardXP(userId, amount, reason = "") {
  await updateDoc(doc(db, "users", userId), {
    xp: increment(amount),
  });
}

// ── Get unlocked achievement IDs for a user ──
export async function getUnlockedAchievements(userId) {
  const q = query(
    collection(db, "achievements"),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().achievementId);
}

// ── Check and award new achievements ──
export async function checkAchievements(userId, stats) {
  const unlocked = await getUnlockedAchievements(userId);
  const newlyUnlocked = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlocked.includes(achievement.id)) continue;
    if (!achievement.check(stats)) continue;

    // Award achievement
    await addDoc(collection(db, "achievements"), {
      userId,
      achievementId: achievement.id,
      unlockedAt:    serverTimestamp(),
    });

    // Award XP bonus
    if (achievement.xpReward > 0) {
      await awardXP(userId, achievement.xpReward, `achievement_${achievement.id}`);
    }

    // Send notification
    await createNotification(userId, {
      type:    "achievement",
      title:   `Achievement Unlocked: ${achievement.title}`,
      message: `${achievement.icon} ${achievement.description} (+${achievement.xpReward} XP)`,
      icon:    "trophy",
      link:    "/dashboard/achievements",
    });

    newlyUnlocked.push(achievement);
  }

  return newlyUnlocked;
}

// ── Update stats after quiz ──
export async function updateStatsAfterQuiz(userId, { score, total, timeTaken, percentage }) {
  const snap     = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return;

  const data     = snap.data();
  const isPerfect = percentage === 100;
  const isFast    = timeTaken <= 120;

  // XP to award
  let xpGained = XP_VALUES.quizComplete;
  if (isPerfect) xpGained += XP_VALUES.quizPerfect;

  const updates = {
    quizzesTaken:  increment(1),
    xp:            increment(xpGained),
  };

  // Track fastest quiz
  if (!data.fastestQuiz || timeTaken < data.fastestQuiz) {
    updates.fastestQuiz = timeTaken;
  }

  // Track perfect score
  if (isPerfect) updates.hasPerfectScore = true;

  await updateDoc(doc(db, "users", userId), updates);

  // Fetch fresh stats for achievement check
  const fresh = (await getDoc(doc(db, "users", userId))).data();
  await checkAchievements(userId, {
    totalDecks:     fresh.totalDecks     ?? 0,
    totalCards:     fresh.totalCards     ?? 0,
    totalCourses:   fresh.totalCourses   ?? 0,
    quizzesTaken:   fresh.quizzesTaken   ?? 0,
    hasPerfectScore: fresh.hasPerfectScore ?? false,
    fastestQuiz:    fresh.fastestQuiz    ?? Infinity,
    streak:         fresh.streak         ?? 0,
    xp:             fresh.xp             ?? 0,
    aiGenerations:  fresh.aiGenerations  ?? 0,
  });
}

// ── Update stats after deck created ──
export async function updateStatsAfterDeckCreated(userId) {
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return;

  await updateDoc(doc(db, "users", userId), {
    totalDecks: increment(1),
    xp:         increment(XP_VALUES.deckCreated),
  });

  const fresh = (await getDoc(doc(db, "users", userId))).data();
  await checkAchievements(userId, {
    totalDecks:     fresh.totalDecks     ?? 0,
    totalCards:     fresh.totalCards     ?? 0,
    totalCourses:   fresh.totalCourses   ?? 0,
    quizzesTaken:   fresh.quizzesTaken   ?? 0,
    hasPerfectScore: fresh.hasPerfectScore ?? false,
    fastestQuiz:    fresh.fastestQuiz    ?? Infinity,
    streak:         fresh.streak         ?? 0,
    xp:             fresh.xp             ?? 0,
    aiGenerations:  fresh.aiGenerations  ?? 0,
  });
}

// ── Update stats after card added ──
export async function updateStatsAfterCardAdded(userId) {
  await updateDoc(doc(db, "users", userId), {
    totalCards: increment(1),
    xp:         increment(XP_VALUES.cardAdded),
  });
}

// ── Update stats after course created ──
export async function updateStatsAfterCourseCreated(userId) {
  await updateDoc(doc(db, "users", userId), {
    totalCourses: increment(1),
    xp:           increment(XP_VALUES.courseCreated),
  });

  const fresh = (await getDoc(doc(db, "users", userId))).data();
  await checkAchievements(userId, {
    totalDecks:     fresh.totalDecks     ?? 0,
    totalCards:     fresh.totalCards     ?? 0,
    totalCourses:   fresh.totalCourses   ?? 0,
    quizzesTaken:   fresh.quizzesTaken   ?? 0,
    hasPerfectScore: fresh.hasPerfectScore ?? false,
    fastestQuiz:    fresh.fastestQuiz    ?? Infinity,
    streak:         fresh.streak         ?? 0,
    xp:             fresh.xp             ?? 0,
    aiGenerations:  fresh.aiGenerations  ?? 0,
  });
}

// ── Update stats after AI generation ──
export async function updateStatsAfterAIGeneration(userId) {
  await updateDoc(doc(db, "users", userId), {
    aiGenerations: increment(1),
    xp:            increment(5),
  });

  const fresh = (await getDoc(doc(db, "users", userId))).data();
  await checkAchievements(userId, {
    totalDecks:     fresh.totalDecks     ?? 0,
    totalCards:     fresh.totalCards     ?? 0,
    totalCourses:   fresh.totalCourses   ?? 0,
    quizzesTaken:   fresh.quizzesTaken   ?? 0,
    hasPerfectScore: fresh.hasPerfectScore ?? false,
    fastestQuiz:    fresh.fastestQuiz    ?? Infinity,
    streak:         fresh.streak         ?? 0,
    xp:             fresh.xp             ?? 0,
    aiGenerations:  fresh.aiGenerations  ?? 0,
  });
}
