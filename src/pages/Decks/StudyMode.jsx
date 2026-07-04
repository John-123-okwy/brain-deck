import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, RotateCcw,
  CheckCircle, XCircle, Loader, BookOpen,
  Trophy, RefreshCw
} from "lucide-react";
import { getDeck } from "../../services/deckService";
import { saveStudySession } from "../../services/historyService";
import { getCards } from "../../services/cardService";
import { useAuth } from "../../context/AuthContext";
import styles from "./StudyMode.module.css";

const colorMap = {
  purple: "#a855f7", indigo: "#6366f1", pink: "#e879f9",
  blue: "#3b82f6",  green:  "#34d399", orange: "#fb923c",
};

export default function StudyMode() {
  const { deckId } = useParams();
  const { currentUser } = useAuth();
  const navigate   = useNavigate();

  const [deck, setDeck]         = useState(null);
  const [cards, setCards]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [index, setIndex]       = useState(0);
  const [flipped, setFlipped]   = useState(false);
  const [known, setKnown]       = useState([]);    // card ids marked "know it"
  const [learning, setLearning] = useState([]);    // card ids marked "still learning"
  const [done, setDone]         = useState(false);
  const [direction, setDirection] = useState(1);   // 1 = forward, -1 = backward

  // ── Elapsed timer (ref so it's always fresh, not stale) ──
  const elapsedRef = useRef(0);
  const timerRef   = useRef(null);

  useEffect(() => {
    elapsedRef.current = 0;
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [deckData, cardsData] = await Promise.all([
        getDeck(deckId), getCards(deckId),
      ]);
      setDeck(deckData);
      // Shuffle cards for variety
      setCards([...cardsData].sort(() => Math.random() - 0.5));
    } catch {
      navigate("/dashboard/decks");
    } finally {
      setLoading(false);
    }
  }, [deckId, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Keyboard controls
  useEffect(() => {
    function onKey(e) {
      if (done) return;
      if (e.code === "Space") { e.preventDefault(); setFlipped((p) => !p); }
      if (e.code === "ArrowRight") goNext(1);
      if (e.code === "ArrowLeft")  goPrev();
      if (e.code === "KeyK") markKnown();
      if (e.code === "KeyL") markLearning();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const current     = cards[index];
  const total       = cards.length;
  const progress    = total > 0 ? ((index) / total) * 100 : 0;
  const accentColor = colorMap[deck?.color] ?? colorMap.purple;

  function goNext(dir = 1) {
    setDirection(dir);
    setFlipped(false);
    setTimeout(() => {
      if (index + 1 >= total) {
        // Stop timer
        clearInterval(timerRef.current);
        // Save study session to history (non-blocking)
        if (currentUser) {
          saveStudySession(currentUser.uid, {
            deckId,
            deckTitle:     deck?.title ?? "Unknown",
            cardCount:     total,
            knownCount:    known.length,
            learningCount: learning.length,
            duration:      elapsedRef.current,
            type:          "flashcard",
          }).catch(() => {});
        }
        setDone(true);
      } else {
        setIndex((p) => p + 1);
      }
    }, 150);
  }

  function goPrev() {
    if (index === 0) return;
    setDirection(-1);
    setFlipped(false);
    setTimeout(() => setIndex((p) => p - 1), 150);
  }

  function markKnown() {
    setKnown((p) => [...p, current.id]);
    goNext(1);
  }

  function markLearning() {
    setLearning((p) => [...p, current.id]);
    goNext(1);
  }

  function restart() {
    setIndex(0);
    setFlipped(false);
    setKnown([]);
    setLearning([]);
    setDone(false);
    setCards((p) => [...p].sort(() => Math.random() - 0.5));
  }

  function restartWrong() {
    const wrongCards = cards.filter((c) => learning.includes(c.id));
    setCards(wrongCards.sort(() => Math.random() - 0.5));
    setIndex(0);
    setFlipped(false);
    setKnown([]);
    setLearning([]);
    setDone(false);
  }

  if (loading) return (
    <div className={styles.centerState}>
      <Loader size={30} className={styles.spinner} />
      <p>Loading cards...</p>
    </div>
  );

  if (cards.length === 0) return (
    <div className={styles.centerState}>
      <BookOpen size={36} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
      <p style={{ color: "var(--text-muted)" }}>No cards in this deck yet.</p>
      <button className="btn-primary" onClick={() => navigate(`/dashboard/decks/${deckId}`)}>
        <span>Add Cards</span>
      </button>
    </div>
  );

  // ── COMPLETE SCREEN ──
  if (done) {
    const knownCount    = known.length;
    const learningCount = learning.length;
    const skippedCount  = total - knownCount - learningCount;
    const pct           = Math.round((knownCount / total) * 100);

    return (
      <div className={styles.page}>
        <motion.button className={styles.backBtn} onClick={() => navigate(`/dashboard/decks/${deckId}`)}>
          <ArrowLeft size={16} /> Back to Deck
        </motion.button>

        <motion.div
          className={styles.completeCard}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className={styles.trophyWrap}
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Trophy size={44} color="#fbbf24" />
          </motion.div>

          <h2 className={styles.completeTitle}>Session Complete!</h2>
          <p className={styles.completeSub}>
            You reviewed all <strong>{total}</strong> cards.
          </p>

          {/* Score ring */}
          <div className={styles.scoreRing} style={{ "--pct": pct, "--accent": accentColor }}>
            <svg viewBox="0 0 100 100" className={styles.ringsvg}>
              <circle cx="50" cy="50" r="42" className={styles.ringBg} />
              <circle
                cx="50" cy="50" r="42"
                className={styles.ringFill}
                style={{
                  stroke: accentColor,
                  strokeDasharray: `${2.64 * pct} 264`,
                }}
              />
            </svg>
            <div className={styles.ringLabel}>
              <span className={styles.ringPct}>{pct}%</span>
              <span className={styles.ringText}>Known</span>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.statsRow}>
            <div className={styles.statBox} style={{ borderColor: "rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.08)" }}>
              <CheckCircle size={20} color="var(--success)" />
              <span className={styles.statNum}>{knownCount}</span>
              <span className={styles.statLbl}>Know it</span>
            </div>
            <div className={styles.statBox} style={{ borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)" }}>
              <XCircle size={20} color="var(--error)" />
              <span className={styles.statNum}>{learningCount}</span>
              <span className={styles.statLbl}>Still learning</span>
            </div>
            <div className={styles.statBox} style={{ borderColor: "var(--glass-border)", background: "var(--bg-card)" }}>
              <RotateCcw size={20} color="var(--text-muted)" />
              <span className={styles.statNum}>{skippedCount}</span>
              <span className={styles.statLbl}>Skipped</span>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.completeActions}>
            <button className="btn-secondary" onClick={() => navigate(`/dashboard/decks/${deckId}`)}>
              Back to Deck
            </button>
            {learningCount > 0 && (
              <button className="btn-secondary" onClick={restartWrong}>
                <RefreshCw size={15} />
                <span>Retry {learningCount} cards</span>
              </button>
            )}
            <button className="btn-primary" onClick={restart}>
              <RefreshCw size={15} />
              <span>Study Again</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── STUDY SCREEN ──
  return (
    <div className={styles.page}>

      {/* Back */}
      <motion.button
        className={styles.backBtn}
        onClick={() => navigate(`/dashboard/decks/${deckId}`)}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      >
        <ArrowLeft size={16} /> Back to Deck
      </motion.button>

      {/* Header info */}
      <div className={styles.studyHeader}>
        <div>
          <h2 className={styles.deckName}>{deck?.title}</h2>
          <p className={styles.cardCounter}>
            Card {index + 1} of {total}
          </p>
        </div>
        <button className={styles.restartBtn} onClick={restart} title="Restart session">
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <motion.div
          className={styles.progressFill}
          style={{ background: accentColor }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* ── FLASHCARD ── */}
      <div className={styles.cardScene} onClick={() => setFlipped((p) => !p)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${index}-${flipped}`}
            className={`${styles.flashcard} ${flipped ? styles.flashcardBack : ""}`}
            style={{ "--accent": accentColor }}
            initial={{ opacity: 0, x: direction * 60, rotateY: flipped ? -90 : 90 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <div className={styles.cardStrip} style={{ background: accentColor }} />

            <div className={styles.cardFaceLabel}>
              {flipped ? "Answer" : "Question"}
            </div>

            <div className={styles.cardTextWrap}>
              <p className={styles.cardText}>
                {flipped ? current?.back : current?.front}
              </p>
            </div>

            <div className={styles.tapHint}>
              {flipped ? "Tap to see question" : "Tap to reveal answer"}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── ACTIONS ── */}
      <div className={styles.actionRow}>
        {/* Prev */}
        <button
          className={styles.navBtn}
          onClick={goPrev}
          disabled={index === 0}
          aria-label="Previous"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Know it / Still learning */}
        <div className={styles.ratingBtns}>
          <motion.button
            className={`${styles.ratingBtn} ${styles.ratingBtnLearning}`}
            onClick={markLearning}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            <XCircle size={18} />
            <span>Still Learning</span>
          </motion.button>
          <motion.button
            className={`${styles.ratingBtn} ${styles.ratingBtnKnown}`}
            onClick={markKnown}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            <CheckCircle size={18} />
            <span>Know It</span>
          </motion.button>
        </div>

        {/* Next */}
        <button
          className={styles.navBtn}
          onClick={() => goNext(1)}
          aria-label="Next"
        >
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Keyboard hint */}
      <p className={styles.keyHint}>
        Press <kbd>Space</kbd> to flip · <kbd>←</kbd> <kbd>→</kbd> to navigate
      </p>

    </div>
  );
}
