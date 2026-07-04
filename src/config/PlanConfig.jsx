// ── BrainDeck Plan Configuration ──
// Single source of truth for all plan limits

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    color: "#7c6a8e",
    limits: {
      decks:          5,
      cardsPerDeck:   30,
      courses:        3,
      aiCredits:      5,      // one-time on signup, never refills
      quizQuestions:  20,
      aiTutor:        false,
    },
  },
  pro: {
    name: "Pro",
    price: 6,
    color: "#a855f7",
    limits: {
      decks:          Infinity,
      cardsPerDeck:   Infinity,
      courses:        Infinity,
      aiCredits:      50,     // refills monthly
      quizQuestions:  Infinity,
      aiTutor:        true,
    },
  },
};

// ── Helper: get a user's plan config ──
export function getPlan(planId) {
  return PLANS[planId] ?? PLANS.free;
}

// ── Helper: check if user can do an action ──
export function canUseFeature(userProfile, feature) {
  const plan = getPlan(userProfile?.plan);
  return plan.limits[feature] !== false;
}

// ── Helper: check numeric limit ──
export function isWithinLimit(userProfile, feature, currentCount) {
  const plan  = getPlan(userProfile?.plan);
  const limit = plan.limits[feature];
  if (limit === Infinity) return true;
  return currentCount < limit;
}

// ── Credit costs per AI action ──
export const CREDIT_COSTS = {
  generateCards: 1,   // 1 credit per AI generation
  tutorMessage:  1,   // 1 credit per 5 tutor messages (handled in service)
};
