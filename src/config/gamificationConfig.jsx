// ── XP values per action ──
export const XP_VALUES = {
  studyCard:      2,   // per card studied
  quizComplete:   20,  // per quiz completed
  quizPerfect:    50,  // bonus for 100% score
  deckCreated:    10,  // per deck created
  cardAdded:      1,   // per card added
  courseCreated:  15,  // per course created
  streakDay:      5,   // per day streak maintained
};

// ── Level thresholds ──
export const LEVELS = [
  { level: 1,  title: "Beginner",    minXP: 0    },
  { level: 2,  title: "Student",     minXP: 50   },
  { level: 3,  title: "Learner",     minXP: 150  },
  { level: 4,  title: "Scholar",     minXP: 300  },
  { level: 5,  title: "Achiever",    minXP: 500  },
  { level: 6,  title: "Expert",      minXP: 750  },
  { level: 7,  title: "Master",      minXP: 1000 },
  { level: 8,  title: "Champion",    minXP: 1500 },
  { level: 9,  title: "Legend",      minXP: 2000 },
  { level: 10, title: "Grand Master",minXP: 3000 },
];

// ── Get level info from XP ──
export function getLevelInfo(xp) {
  let current = LEVELS[0];
  let next    = LEVELS[1];

  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXP) {
      current = LEVELS[i];
      next    = LEVELS[i + 1] ?? null;
    }
  }

  const progress = next
    ? Math.round(((xp - current.minXP) / (next.minXP - current.minXP)) * 100)
    : 100;

  return { current, next, progress, xp };
}

// ── Achievement definitions ──
export const ACHIEVEMENTS = [
  // Decks
  {
    id:          "first_deck",
    title:       "Deck Builder",
    description: "Create your first deck",
    icon:        "📚",
    color:       "purple",
    xpReward:    25,
    check:       (stats) => stats.totalDecks >= 1,
  },
  {
    id:          "deck_collector",
    title:       "Deck Collector",
    description: "Create 5 decks",
    icon:        "🗂️",
    color:       "indigo",
    xpReward:    50,
    check:       (stats) => stats.totalDecks >= 5,
  },
  // Cards
  {
    id:          "first_card",
    title:       "Card Maker",
    description: "Add your first flashcard",
    icon:        "🃏",
    color:       "blue",
    xpReward:    10,
    check:       (stats) => stats.totalCards >= 1,
  },
  {
    id:          "card_hundred",
    title:       "Centurion",
    description: "Create 100 flashcards",
    icon:        "💯",
    color:       "gold",
    xpReward:    100,
    check:       (stats) => stats.totalCards >= 100,
  },
  // Quizzes
  {
    id:          "first_quiz",
    title:       "Quiz Taker",
    description: "Complete your first quiz",
    icon:        "📝",
    color:       "green",
    xpReward:    25,
    check:       (stats) => stats.quizzesTaken >= 1,
  },
  {
    id:          "quiz_master",
    title:       "Quiz Master",
    description: "Complete 10 quizzes",
    icon:        "🏆",
    color:       "gold",
    xpReward:    75,
    check:       (stats) => stats.quizzesTaken >= 10,
  },
  {
    id:          "perfect_score",
    title:       "Perfectionist",
    description: "Score 100% on a quiz",
    icon:        "⭐",
    color:       "gold",
    xpReward:    100,
    check:       (stats) => stats.hasPerfectScore,
  },
  {
    id:          "speed_demon",
    title:       "Speed Demon",
    description: "Complete a quiz in under 2 minutes",
    icon:        "⚡",
    color:       "orange",
    xpReward:    50,
    check:       (stats) => stats.fastestQuiz <= 120,
  },
  // Streaks
  {
    id:          "streak_3",
    title:       "On a Roll",
    description: "Study 3 days in a row",
    icon:        "🔥",
    color:       "orange",
    xpReward:    30,
    check:       (stats) => stats.streak >= 3,
  },
  {
    id:          "streak_7",
    title:       "Week Warrior",
    description: "Study 7 days in a row",
    icon:        "🔥🔥",
    color:       "pink",
    xpReward:    75,
    check:       (stats) => stats.streak >= 7,
  },
  {
    id:          "streak_30",
    title:       "Unstoppable",
    description: "Study 30 days in a row",
    icon:        "🌟",
    color:       "gold",
    xpReward:    300,
    check:       (stats) => stats.streak >= 30,
  },
  // Courses
  {
    id:          "first_course",
    title:       "Course Creator",
    description: "Create your first course",
    icon:        "🎓",
    color:       "indigo",
    xpReward:    30,
    check:       (stats) => stats.totalCourses >= 1,
  },
  // AI
  {
    id:          "ai_user",
    title:       "AI Explorer",
    description: "Use AI to generate flashcards",
    icon:        "🤖",
    color:       "purple",
    xpReward:    40,
    check:       (stats) => stats.aiGenerations >= 1,
  },
  // XP milestones
  {
    id:          "xp_100",
    title:       "Getting Started",
    description: "Earn 100 XP",
    icon:        "✨",
    color:       "purple",
    xpReward:    0,
    check:       (stats) => stats.xp >= 100,
  },
  {
    id:          "xp_500",
    title:       "Dedicated Learner",
    description: "Earn 500 XP",
    icon:        "💪",
    color:       "indigo",
    xpReward:    0,
    check:       (stats) => stats.xp >= 500,
  },
];
