import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, RotateCcw,
  CheckCircle, XCircle, Loader,
  BookOpen, Trophy, RefreshCw,
  GraduationCap, ChevronRight,
} from "lucide-react";
import { getCourse } from "../../services/courseService";
import { getUserDecks } from "../../services/deckService";
import { getCards } from "../../services/cardService";
import { useAuth } from "../../context/AuthContext";
import styles from "./CourseStudyMode.module.css";

const colorMap = {
  purple: "#a855f7", indigo: "#6366f1", pink: "#e879f9",
  blue:   "#3b82f6", green:  "#34d399", orange: "#fb923c",
};

// SCREENS
const SCREEN = {
  LOADING:   "loading",
  INTRO:     "intro",
  STUDY:     "study",
  DECK_DONE: "deck_done",
  COMPLETE:  "complete",
};

export default function CourseStudyMode() {
  const { courseId }    = useParams();
  const navigate        = useNavigate();
  const { currentUser } = useAuth();

  const [screen, setScreen]       = useState(SCREEN.LOADING);
  const [course, setCourse]       = useState(null);
  const [deckQueue, setDeckQueue] = useState([]); // [{ deck, cards }]
  const [error, setError]         = useState("");

  // Current position
  const [deckIndex, setDeckIndex]   = useState(0);
  const [cardIndex, setCardIndex]   = useState(0);
  const [flipped, setFlipped]       = useState(false);
  const [direction, setDirection]   = useState(1);

  // Per-session tracking
  const [known, setKnown]       = useState([]); // { deckId, cardId }
  const [learning, setLearning] = useState([]);

  const fetchAll = useCallback(async () => {
    try {
      const [c, allDecks] = await Promise.all([
        getCourse(courseId),
        getUserDecks(currentUser.uid),
      ]);
      if (!c || !c.deckIds?.length) {
        navigate("/dashboard/courses");
        return;
      }

      // Only keep decks that belong to this course, in order
      const courseDecks = c.deckIds
        .map((id) => allDecks.find((d) => d.id === id))
        .filter(Boolean);

      // Fetch cards for each deck
      const queued = await Promise.all(
        courseDecks.map(async (deck) => {
          const cards = await getCards(deck.id);
          return { deck, cards };
        })
      );

      // Filter out empty decks
      const withCards = queued.filter((q) => q.cards.length > 0);
      if (!withCards.length) {
        navigate("/dashboard/courses");
        return;
      }

      setCourse(c);
      setDeckQueue(withCards);
      setScreen(SCREEN.INTRO);
    } catch {
      setError("Failed to load course.");
      setScreen(SCREEN.INTRO);
    }
  }, [courseId, currentUser, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived ──
  const currentDeckEntry = deckQueue[deckIndex];
  const currentDeck      = currentDeckEntry?.deck;
  const currentCards     = currentDeckEntry?.cards ?? [];
  const currentCard      = currentCards[cardIndex];
  const accentColor      = colorMap[currentDeck?.color ?? course?.color] ?? colorMap.purple;
  const courseAccent     = colorMap[course?.color] ?? colorMap.purple;

  const totalCards    = deckQueue.reduce((a, q) => a + q.cards.length, 0);
  const cardsStudied  = deckQueue
    .slice(0, deckIndex)
    .reduce((a, q) => a + q.cards.length, 0) + cardIndex;
  const overallProgress = totalCards > 0 ? Math.round((cardsStudied / totalCards) * 100) : 0;

  // ── Navigation ──
  function goNext(dir = 1) {
    setDirection(dir);
    setFlipped(false);

    setTimeout(() => {
      if (cardIndex + 1 >= currentCards.length) {
        // Deck finished
        setScreen(SCREEN.DECK_DONE);
      } else {
        setCardIndex((p) => p + 1);
      }
    }, 120);
  }

  function goPrev() {
    if (cardIndex === 0) return;
    setDirection(-1);
    setFlipped(false);
    setTimeout(() => setCardIndex((p) => p - 1), 120);
  }

  function markKnown() {
    setKnown((p) => [...p, { deckId: currentDeck.id, cardId: currentCard.id }]);
    goNext(1);
  }

  function markLearning() {
    setLearning((p) => [...p, { deckId: currentDeck.id, cardId: currentCard.id }]);
    goNext(1);
  }

  function nextDeck() {
    if (deckIndex + 1 >= deckQueue.length) {
      setScreen(SCREEN.COMPLETE);
    } else {
      setDeckIndex((p) => p + 1);
      setCardIndex(0);
      setFlipped(false);
      setScreen(SCREEN.STUDY);
    }
  }

  function restartCourse() {
    setDeckIndex(0);
    setCardIndex(0);
    setFlipped(false);
    setKnown([]);
    setLearning([]);
    setScreen(SCREEN.STUDY);
  }

  // ── Keyboard ──
  useEffect(() => {
    if (screen !== SCREEN.STUDY) return;
    function onKey(e) {
      if (e.code === "Space")       { e.preventDefault(); setFlipped((p) => !p); }
      if (e.code === "ArrowRight")  goNext(1);
      if (e.code === "ArrowLeft")   goPrev();
      if (e.code === "KeyK")        markKnown();
      if (e.code === "KeyL")        markLearning();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ════════════════════════════════
  // LOADING
  // ════════════════════════════════
  if (screen === SCREEN.LOADING) return (
    <div className={styles.centerState}>
      <Loader size={28} className={styles.spinner} />
      <p>Loading course...</p>
    </div>
  );

  // ════════════════════════════════
  // INTRO SCREEN
  // ════════════════════════════════
  if (screen === SCREEN.INTRO) return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate(`/dashboard/courses/${courseId}`)}>
        <ArrowLeft size={16} /> Back to Course
      </button>

      <motion.div
        className={styles.introCard}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.introIcon} style={{ background: `${courseAccent}20`, border: `1px solid ${courseAccent}35` }}>
          <GraduationCap size={36} style={{ color: courseAccent }} />
        </div>

        <h1 className={styles.introTitle}>{course?.title}</h1>
        {course?.description && <p className={styles.introDesc}>{course.description}</p>}

        <div className={styles.introStats}>
          <div className={styles.introStat}>
            <BookOpen size={16} style={{ color: courseAccent }} />
            <span><strong>{deckQueue.length}</strong> decks</span>
          </div>
          <div className={styles.introStat}>
            <BookOpen size={16} style={{ color: courseAccent }} />
            <span><strong>{totalCards}</strong> cards total</span>
          </div>
        </div>

        {/* Deck list preview */}
        <div className={styles.introDecks}>
          {deckQueue.map(({ deck, cards }, i) => {
            const da = colorMap[deck.color] ?? colorMap.purple;
            return (
              <div key={deck.id} className={styles.introDeckRow}>
                <div className={styles.introDeckNum} style={{ background: `${da}18`, color: da }}>
                  {i + 1}
                </div>
                <div className={styles.introDeckIcon} style={{ background: `${da}18`, color: da }}>
                  <BookOpen size={14} />
                </div>
                <div className={styles.introDeckInfo}>
                  <p className={styles.introDeckTitle}>{deck.title}</p>
                  <p className={styles.introDeckSub}>{cards.length} cards</p>
                </div>
                <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
              </div>
            );
          })}
        </div>

        <motion.button
          className="btn-primary"
          style={{ width: "100%", padding: "14px", fontSize: "1rem", justifyContent: "center" }}
          onClick={() => setScreen(SCREEN.STUDY)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Start Studying
          <ChevronRight size={17} />
        </motion.button>
      </motion.div>
    </div>
  );

  // ════════════════════════════════
  // DECK DONE SCREEN
  // ════════════════════════════════
  if (screen === SCREEN.DECK_DONE) {
    const deckKnown    = known.filter((k) => k.deckId === currentDeck.id).length;
    const deckLearning = learning.filter((l) => l.deckId === currentDeck.id).length;
    const isLast       = deckIndex + 1 >= deckQueue.length;
    const nextDeckEntry = deckQueue[deckIndex + 1];

    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => navigate(`/dashboard/courses/${courseId}`)}>
          <ArrowLeft size={16} /> Back to Course
        </button>

        <motion.div
          className={styles.deckDoneCard}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className={styles.deckDoneIcon} style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}>
            <CheckCircle size={36} style={{ color: accentColor }} />
          </div>

          <h2 className={styles.deckDoneTitle}>Deck Complete!</h2>
          <p className={styles.deckDoneSub}>
            You finished <strong>{currentDeck.title}</strong>
          </p>

          {/* Stats */}
          <div className={styles.deckDoneStats}>
            <div className={styles.deckDoneStat} style={{ background: "rgba(52,211,153,0.08)", borderColor: "rgba(52,211,153,0.25)" }}>
              <CheckCircle size={18} color="var(--success)" />
              <span className={styles.deckDoneStatNum}>{deckKnown}</span>
              <span className={styles.deckDoneStatLbl}>Know it</span>
            </div>
            <div className={styles.deckDoneStat} style={{ background: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.25)" }}>
              <XCircle size={18} color="var(--error)" />
              <span className={styles.deckDoneStatNum}>{deckLearning}</span>
              <span className={styles.deckDoneStatLbl}>Still learning</span>
            </div>
          </div>

          {/* Overall progress */}
          <div className={styles.overallProgress}>
            <div className={styles.overallProgressHeader}>
              <span className={styles.overallProgressLabel}>Course Progress</span>
              <span className={styles.overallProgressPct} style={{ color: courseAccent }}>
                {deckIndex + 1}/{deckQueue.length} decks
              </span>
            </div>
            <div className={styles.overallProgressBar}>
              <motion.div
                className={styles.overallProgressFill}
                style={{ background: courseAccent }}
                initial={{ width: `${(deckIndex / deckQueue.length) * 100}%` }}
                animate={{ width: `${((deckIndex + 1) / deckQueue.length) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Next deck preview */}
          {!isLast && nextDeckEntry && (
            <div className={styles.nextDeckPreview}>
              <p className={styles.nextDeckLabel}>Up next:</p>
              <div className={styles.nextDeckRow}>
                <div
                  className={styles.nextDeckIcon}
                  style={{ background: `${colorMap[nextDeckEntry.deck.color] ?? colorMap.purple}20`, color: colorMap[nextDeckEntry.deck.color] ?? colorMap.purple }}
                >
                  <BookOpen size={15} />
                </div>
                <div>
                  <p className={styles.nextDeckTitle}>{nextDeckEntry.deck.title}</p>
                  <p className={styles.nextDeckSub}>{nextDeckEntry.cards.length} cards</p>
                </div>
              </div>
            </div>
          )}

          <div className={styles.deckDoneActions}>
            <button className="btn-secondary" onClick={() => navigate(`/dashboard/courses/${courseId}`)}>
              Exit Course
            </button>
            {isLast ? (
              <button className="btn-primary" onClick={() => setScreen(SCREEN.COMPLETE)}>
                <Trophy size={15} /><span>See Results</span>
              </button>
            ) : (
              <button className="btn-primary" onClick={nextDeck}>
                Next Deck <ChevronRight size={15} />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ════════════════════════════════
  // COMPLETE SCREEN
  // ════════════════════════════════
  if (screen === SCREEN.COMPLETE) {
    const totalKnown    = known.length;
    const totalLearning = learning.length;
    const pct           = totalCards > 0 ? Math.round((totalKnown / totalCards) * 100) : 0;

    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => navigate(`/dashboard/courses/${courseId}`)}>
          <ArrowLeft size={16} /> Back to Course
        </button>

        <motion.div
          className={styles.completeCard}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className={styles.trophyWrap}
            initial={{ scale: 0.5, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 180 }}
          >
            <Trophy size={44} color="#fbbf24" />
          </motion.div>

          <h2 className={styles.completeTitle}>Course Complete!</h2>
          <p className={styles.completeSub}>
            You studied all <strong>{deckQueue.length}</strong> decks and <strong>{totalCards}</strong> cards in{" "}
            <strong>{course?.title}</strong>.
          </p>

          {/* Score ring */}
          <div className={styles.scoreRing}>
            <svg viewBox="0 0 100 100" className={styles.ringsvg}>
              <circle cx="50" cy="50" r="42" className={styles.ringBg} />
              <circle
                cx="50" cy="50" r="42"
                className={styles.ringFill}
                style={{ stroke: courseAccent, strokeDasharray: `${2.64 * pct} 264` }}
              />
            </svg>
            <div className={styles.ringLabel}>
              <span className={styles.ringPct}>{pct}%</span>
              <span className={styles.ringText}>Known</span>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.completeStats}>
            <div className={styles.completeStat}>
              <CheckCircle size={20} color="var(--success)" />
              <span className={styles.completeStatNum}>{totalKnown}</span>
              <span className={styles.completeStatLbl}>Know it</span>
            </div>
            <div className={styles.completeStat}>
              <XCircle size={20} color="var(--error)" />
              <span className={styles.completeStatNum}>{totalLearning}</span>
              <span className={styles.completeStatLbl}>Still learning</span>
            </div>
            <div className={styles.completeStat}>
              <BookOpen size={20} color="var(--purple-light)" />
              <span className={styles.completeStatNum}>{deckQueue.length}</span>
              <span className={styles.completeStatLbl}>Decks done</span>
            </div>
          </div>

          <div className={styles.completeActions}>
            <button className="btn-secondary" onClick={() => navigate(`/dashboard/courses/${courseId}`)}>
              Back to Course
            </button>
            <button className="btn-secondary" onClick={() => navigate("/dashboard/quizzes")}>
              Take a Quiz
            </button>
            <button className="btn-primary" onClick={restartCourse}>
              <RefreshCw size={15} /><span>Study Again</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ════════════════════════════════
  // STUDY SCREEN
  // ════════════════════════════════
  return (
    <div className={styles.page}>

      {/* Back */}
      <motion.button
        className={styles.backBtn}
        onClick={() => navigate(`/dashboard/courses/${courseId}`)}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      >
        <ArrowLeft size={16} /> Exit Course
      </motion.button>

      {/* Header */}
      <div className={styles.studyHeader}>
        <div>
          <p className={styles.courseLabel}>{course?.title}</p>
          <h2 className={styles.deckLabel}>
            <span style={{ color: accentColor }}>{currentDeck?.title}</span>
            <span className={styles.deckProgress}>
              {" "}— Deck {deckIndex + 1} of {deckQueue.length}
            </span>
          </h2>
        </div>
        <button className={styles.restartBtn} onClick={restartCourse} title="Restart course">
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Overall progress bar */}
      <div className={styles.overallBar}>
        <div className={styles.overallBarTrack}>
          <motion.div
            className={styles.overallBarFill}
            style={{ background: courseAccent }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <span className={styles.overallBarPct} style={{ color: courseAccent }}>
          {overallProgress}%
        </span>
      </div>

      {/* Deck progress */}
      <div className={styles.deckProgressRow}>
        <span className={styles.cardCounter}>
          Card {cardIndex + 1} of {currentCards.length}
        </span>
        <div className={styles.deckProgressBar}>
          <motion.div
            className={styles.deckProgressFill}
            style={{ background: accentColor }}
            animate={{ width: `${((cardIndex) / currentCards.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className={styles.cardScene} onClick={() => setFlipped((p) => !p)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${deckIndex}-${cardIndex}-${flipped}`}
            className={`${styles.flashcard} ${flipped ? styles.flashcardBack : ""}`}
            style={{ "--accent": accentColor }}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className={styles.cardStrip} style={{ background: accentColor }} />
            <div className={styles.cardFaceLabel}>{flipped ? "Answer" : "Question"}</div>
            <div className={styles.cardTextWrap}>
              <p className={styles.cardText}>
                {flipped ? currentCard?.back : currentCard?.front}
              </p>
            </div>
            <div className={styles.tapHint}>
              {flipped ? "Tap to see question" : "Tap to reveal answer"}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className={styles.actionRow}>
        <button
          className={styles.navBtn}
          onClick={goPrev}
          disabled={cardIndex === 0}
        >
          <ArrowLeft size={18} />
        </button>

        <div className={styles.ratingBtns}>
          <motion.button
            className={`${styles.ratingBtn} ${styles.ratingBtnLearning}`}
            onClick={markLearning}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            <XCircle size={18} /><span>Still Learning</span>
          </motion.button>
          <motion.button
            className={`${styles.ratingBtn} ${styles.ratingBtnKnown}`}
            onClick={markKnown}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            <CheckCircle size={18} /><span>Know It</span>
          </motion.button>
        </div>

        <button className={styles.navBtn} onClick={() => goNext(1)}>
          <ArrowRight size={18} />
        </button>
      </div>

      <p className={styles.keyHint}>
        <kbd>Space</kbd> flip · <kbd>←</kbd><kbd>→</kbd> navigate · <kbd>K</kbd> know it · <kbd>L</kbd> still learning
      </p>
    </div>
  );
}
