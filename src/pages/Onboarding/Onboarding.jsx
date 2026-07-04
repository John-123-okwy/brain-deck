import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, BookOpen, Layers, ClipboardList,
  ChevronRight, ChevronLeft, X, Sparkles,
  Check, Trophy, Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import styles from "./Onboarding.module.css";

const STEPS = [
  {
    id:          "welcome",
    icon:        Brain,
    iconColor:   "purple",
    title:       "Welcome to BrainDeck! 🎉",
    description: "Your personal AI-powered study companion. Let's show you around in just 3 quick steps.",
    features: [
      { icon: BookOpen,      text: "Create decks and flashcards" },
      { icon: ClipboardList, text: "Take quizzes to test yourself" },
      { icon: Sparkles,      text: "Let AI generate cards for you" },
      { icon: Trophy,        text: "Earn XP and unlock achievements" },
    ],
    cta: "Let's Get Started",
  },
  {
    id:          "decks",
    icon:        BookOpen,
    iconColor:   "indigo",
    title:       "Create Your First Deck",
    description: "A deck is a collection of flashcards on a topic. Think of it like a digital notebook for one subject.",
    tips: [
      "Name it after a subject or chapter",
      "Add a description to remember what it covers",
      "Pick a color to make it easy to spot",
    ],
    cta:         "Next",
    preview:     "deck",
  },
  {
    id:          "cards",
    icon:        Layers,
    iconColor:   "pink",
    title:       "Add Flashcards",
    description: "Each card has a front (question or term) and a back (answer or definition). Keep them short and clear.",
    tips: [
      "Front: What is photosynthesis?",
      "Back: Process by which plants use sunlight to make food",
      "Or use AI to generate cards from your notes automatically",
    ],
    cta:         "Next",
    preview:     "card",
  },
  {
    id:          "quiz",
    icon:        ClipboardList,
    iconColor:   "green",
    title:       "Take a Quiz",
    description: "Test what you know! Quizzes generate questions from your cards automatically — multiple choice or true/false.",
    tips: [
      "Set a timer to challenge yourself",
      "Select multiple decks for a combined quiz",
      "Review wrong answers to improve",
    ],
    cta:         "Start Learning",
    preview:     "quiz",
  },
];

// Mini preview components
function DeckPreview() {
  return (
    <div className={styles.preview}>
      <div className={styles.previewDeck}>
        <div className={styles.previewDeckStrip} />
        <div className={styles.previewDeckIcon}>
          <BookOpen size={18} color="white" />
        </div>
        <div className={styles.previewDeckInfo}>
          <p className={styles.previewDeckSubject}>Biology</p>
          <p className={styles.previewDeckTitle}>Cell Biology Chapter 1</p>
          <p className={styles.previewDeckCount}>12 cards</p>
        </div>
      </div>
    </div>
  );
}

function CardPreview() {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className={styles.preview} onClick={() => setFlipped((p) => !p)}>
      <motion.div
        className={`${styles.previewCard} ${flipped ? styles.previewCardBack : ""}`}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.4 }}
        style={{ cursor: "pointer" }}
      >
        <p className={styles.previewCardLabel}>{flipped ? "Answer" : "Question"}</p>
        <p className={styles.previewCardText}>
          {flipped
            ? "The process by which plants convert sunlight into food"
            : "What is photosynthesis?"}
        </p>
        <p className={styles.previewCardHint}>Tap to flip</p>
      </motion.div>
    </div>
  );
}

function QuizPreview() {
  const [selected, setSelected] = useState(null);
  const options = ["Mitochondria", "Nucleus", "Ribosome", "Cell membrane"];
  return (
    <div className={styles.preview}>
      <div className={styles.previewQuiz}>
        <p className={styles.previewQuizQ}>What is the powerhouse of the cell?</p>
        <div className={styles.previewQuizOptions}>
          {options.map((o) => (
            <button
              key={o}
              className={`${styles.previewQuizOption}
                ${selected === o ? (o === "Mitochondria" ? styles.previewCorrect : styles.previewWrong) : ""}
              `}
              onClick={() => setSelected(o)}
            >
              {selected === o && o === "Mitochondria" && <Check size={13} />}
              {o}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Onboarding({ onComplete }) {
  const { currentUser, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep]       = useState(0);
  const [skipping, setSkipping] = useState(false);

  const current  = STEPS[step];
  const isLast   = step === STEPS.length - 1;
  const isFirst  = step === 0;

  async function finish() {
    try {
      await updateUserProfile({ onboardingComplete: true });
    } catch {}
    onComplete();
    navigate("/dashboard/decks/new" in {} ? "/dashboard/decks" : "/dashboard/decks");
  }

  async function handleSkip() {
    setSkipping(true);
    try {
      await updateUserProfile({ onboardingComplete: true });
    } catch {}
    onComplete();
  }

  function handleCta() {
    if (isLast) {
      finish();
    } else {
      setStep((p) => p + 1);
    }
  }

  const iconColors = {
    purple: "linear-gradient(135deg, #a855f7, #6366f1)",
    indigo: "linear-gradient(135deg, #6366f1, #3b82f6)",
    pink:   "linear-gradient(135deg, #e879f9, #a855f7)",
    green:  "linear-gradient(135deg, #34d399, #059669)",
  };

  const Icon = current.icon;

  return (
    <div className={styles.overlay}>
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Skip button */}
        <button
          className={styles.skipBtn}
          onClick={handleSkip}
          disabled={skipping}
        >
          <X size={16} /> Skip
        </button>

        {/* Step dots */}
        <div className={styles.dots}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`${styles.dot} ${i === step ? styles.dotActive : ""} ${i < step ? styles.dotDone : ""}`}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className={styles.content}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* Icon */}
            <motion.div
              className={styles.iconWrap}
              style={{ background: iconColors[current.iconColor] }}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3, type: "spring" }}
            >
              <Icon size={32} color="white" />
            </motion.div>

            {/* Title + description */}
            <h2 className={styles.title}>{current.title}</h2>
            <p className={styles.description}>{current.description}</p>

            {/* Features list (welcome step) */}
            {current.features && (
              <div className={styles.featureList}>
                {current.features.map(({ icon: FIcon, text }, i) => (
                  <motion.div
                    key={text}
                    className={styles.featureItem}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                  >
                    <div className={styles.featureIcon}>
                      <FIcon size={16} />
                    </div>
                    <span>{text}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Tips list */}
            {current.tips && (
              <div className={styles.tipsList}>
                {current.tips.map((tip, i) => (
                  <motion.div
                    key={tip}
                    className={styles.tipItem}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.07 }}
                  >
                    <div className={styles.tipNum}>{i + 1}</div>
                    <span>{tip}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Previews */}
            {current.preview === "deck" && <DeckPreview />}
            {current.preview === "card" && <CardPreview />}
            {current.preview === "quiz" && <QuizPreview />}

          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className={styles.nav}>
          {!isFirst && (
            <button
              className={styles.backBtn}
              onClick={() => setStep((p) => p - 1)}
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}

          <motion.button
            className={`btn-primary ${styles.ctaBtn}`}
            onClick={handleCta}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {isLast ? (
              <><Zap size={16} /><span>{current.cta}</span></>
            ) : (
              <><span>{current.cta}</span><ChevronRight size={16} /></>
            )}
          </motion.button>
        </div>

        {/* Step label */}
        <p className={styles.stepLabel}>
          Step {step + 1} of {STEPS.length}
        </p>
      </motion.div>
    </div>
  );
}
