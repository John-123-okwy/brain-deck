import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle, XCircle,
  Loader, Clock, ChevronRight, ChevronLeft,
  AlertTriangle, Send, RotateCcw, BookOpen,
} from "lucide-react";
import { getCards } from "../../services/cardService";
import { generateQuestions, saveQuizResult } from "../../services/quizService";
import { createNotification, quizResultNotif } from "../../services/notificationService";
import { updateStatsAfterQuiz } from "../../services/gamificationService";
import { useAuth } from "../../context/AuthContext";
import styles from "./QuizSession.module.css";

const SCREEN = { QUIZ: "quiz", RESULTS: "results", REVIEW: "review" };

function safeNum(v) { const n = Number(v); return isNaN(n) ? 0 : n; }

function gradeColor(pct) {
  if (pct >= 75) return "var(--success)";
  if (pct >= 50) return "var(--warning)";
  return "var(--error)";
}

export default function QuizSession() {
  const { state }       = useLocation();
  const navigate        = useNavigate();
  const { currentUser } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent]     = useState(0);
  const [screen, setScreen]       = useState(SCREEN.QUIZ);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [results, setResults]     = useState(null);

  // answers stored in both state (re-render) and ref (stale-closure-safe)
  const [answers, setAnswers] = useState({});
  const answersRef            = useRef({});

  // Timer
  const timeLimit      = (state?.timeLimit ?? 0) * 60;
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [elapsed, setElapsed]   = useState(0);
  const timerRef       = useRef(null);
  const elapsedRef     = useRef(null);
  const autoSubmitted  = useRef(false);
  const elapsedCount   = useRef(0);

  // Support both single-deck (old) and multi-deck (new) navigation
  const selectedDecks = state?.selectedDecks ?? (state?.deck ? [state.deck] : []);
  const questionCount = state?.questionCount ?? 10;
  const types         = state?.types ?? ["multiplechoice", "truefalse"];

  // ── Load questions from all selected decks ──
  const init = useCallback(async () => {
    try {
      setLoading(true);

      if (!selectedDecks.length) {
        navigate("/dashboard/quizzes");
        return;
      }

      // Fetch cards from all decks and tag each card with deckId + deckTitle
      const allCards = [];
      await Promise.all(
        selectedDecks.map(async (deck) => {
          const cards = await getCards(deck.id);
          cards.forEach((card) => {
            allCards.push({ ...card, deckId: deck.id, deckTitle: deck.title });
          });
        })
      );

      if (allCards.length < 2) {
        navigate("/dashboard/quizzes");
        return;
      }

      const qs = generateQuestions(allCards, questionCount, types);
      setQuestions(qs);

      // Reset everything
      answersRef.current   = {};
      setAnswers({});
      setCurrent(0);
      setScreen(SCREEN.QUIZ);
      setResults(null);
      autoSubmitted.current = false;
      elapsedCount.current  = 0;
      setTimeLeft(timeLimit);
      setElapsed(0);
    } catch {
      navigate("/dashboard/quizzes");
    } finally {
      setLoading(false);
    }
  }, [selectedDecks, questionCount, types, navigate, timeLimit]);

  useEffect(() => { init(); }, [init]);

  // ── Timers ──
  useEffect(() => {
    if (screen !== SCREEN.QUIZ) {
      clearInterval(timerRef.current);
      clearInterval(elapsedRef.current);
      return;
    }

    elapsedRef.current = setInterval(() => {
      elapsedCount.current += 1;
      setElapsed(elapsedCount.current);
    }, 1000);

    if (timeLimit > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          if (next <= 0 && !autoSubmitted.current) {
            autoSubmitted.current = true;
            clearInterval(timerRef.current);
            clearInterval(elapsedRef.current);
            doSubmit(true, answersRef.current, elapsedCount.current);
          }
          return next <= 0 ? 0 : next;
        });
      }, 1000);
    }

    return () => {
      clearInterval(timerRef.current);
      clearInterval(elapsedRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, timeLimit]);

  function formatTime(s) {
    const m   = Math.floor(Math.abs(s) / 60);
    const sec = Math.abs(s) % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  // ── Select answer — update both state and ref ──
  function handleAnswer(option) {
    const updated = { ...answersRef.current, [current]: option };
    answersRef.current = updated;
    setAnswers({ ...updated });
  }

  function goTo(index) {
    if (index < 0 || index >= questions.length) return;
    setCurrent(index);
  }

  // ── Core submit — uses explicit snapshots to avoid stale closures ──
  async function doSubmit(auto, answersSnapshot, elapsedSnapshot) {
    clearInterval(timerRef.current);
    clearInterval(elapsedRef.current);

    const computed = questions.map((q, i) => ({
      question: q,
      chosen:   answersSnapshot[i] ?? null,
      correct:  answersSnapshot[i] === q.correctAnswer,
    }));

    const score = computed.filter((r) => r.correct).length;
    const pct   = Math.round((score / questions.length) * 100);

    // Build per-deck breakdown
    const deckMap = {};
    computed.forEach(({ question: q, correct }) => {
      if (!deckMap[q.deckId]) {
        deckMap[q.deckId] = { deckId: q.deckId, deckTitle: q.deckTitle, correct: 0, total: 0 };
      }
      deckMap[q.deckId].total  += 1;
      deckMap[q.deckId].correct += correct ? 1 : 0;
    });

    const deckBreakdown = Object.values(deckMap).map((d) => ({
      ...d,
      pct: Math.round((d.correct / d.total) * 100),
    }));

    // Save to Firestore
    try {
      setSaving(true);
      const isMulti = selectedDecks.length > 1;
      await saveQuizResult(currentUser.uid, {
        deckId:    isMulti ? null : selectedDecks[0]?.id,
        deckIds:   selectedDecks.map((d) => d.id),
        deckTitle: isMulti
          ? `${selectedDecks.length} decks`
          : selectedDecks[0]?.title ?? "Unknown",
        score,
        total:      questions.length,
        percentage: pct,
        timeTaken:  elapsedSnapshot,
      });
      // Create notification for quiz result
      await createNotification(currentUser.uid,
        quizResultNotif(
          isMulti ? `${selectedDecks.length} decks` : selectedDecks[0]?.title ?? "Quiz",
          score, questions.length, pct
        )
      );
      // Award XP + check achievements
      await updateStatsAfterQuiz(currentUser.uid, {
        score, total: questions.length, timeTaken: elapsedSnapshot, percentage: pct,
      });
    } catch { /* non-blocking */ }
    finally { setSaving(false); }

    setResults({ computed, score, pct, timeTaken: elapsedSnapshot, wasAutoSubmitted: auto, deckBreakdown });
    setScreen(SCREEN.RESULTS);
  }

  function handleSubmit() {
    doSubmit(false, answersRef.current, elapsedCount.current);
  }

  // ── Derived ──
  const answeredCount = Object.keys(answers).length;
  const unanswered    = questions.length - answeredCount;
  const progress      = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const timerWarning  = timeLimit > 0 && timeLeft <= 60 && timeLeft > 0;
  const timerDanger   = timeLimit > 0 && timeLeft <= 20 && timeLeft > 0;

  // ════════════════════════════════
  // LOADING
  // ════════════════════════════════
  if (loading) return (
    <div className={styles.centerState}>
      <Loader size={28} className={styles.spinner} />
      <p>Generating questions...</p>
    </div>
  );

  // ════════════════════════════════
  // REVIEW SCREEN
  // ════════════════════════════════
  if (screen === SCREEN.REVIEW && results) {
    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => setScreen(SCREEN.RESULTS)}>
          <ArrowLeft size={16} /> Back to Results
        </button>

        <div className={styles.reviewHeader}>
          <h2 className={styles.reviewTitle}>Answer Review</h2>
          <p className={styles.reviewSub}>{results.score} / {questions.length} correct</p>
        </div>

        <div className={styles.reviewList}>
          {results.computed.map((r, i) => (
            <motion.div
              key={i}
              className={`${styles.reviewItem} ${r.correct ? styles.reviewCorrect : styles.reviewWrong}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className={styles.reviewMeta}>
                <span className={styles.reviewNum}>Q{i + 1}</span>
                {r.correct
                  ? <CheckCircle size={18} color="var(--success)" />
                  : <XCircle    size={18} color="var(--error)" />
                }
              </div>
              <div className={styles.reviewContent}>
                {/* Deck source tag for multi-deck */}
                {selectedDecks.length > 1 && (
                  <span className={styles.reviewDeckTag}>
                    <BookOpen size={11} /> {r.question.deckTitle}
                  </span>
                )}
                {r.question.type === "truefalse" && (
                  <p className={styles.reviewStatement}>Statement: "{r.question.statement}"</p>
                )}
                <p className={styles.reviewQ}>{r.question.question}</p>
                <div className={styles.reviewAnswers}>
                  <div className={`${styles.reviewAnswerRow} ${r.correct ? styles.reviewAnswerCorrect : styles.reviewAnswerWrong}`}>
                    <span className={styles.reviewAnswerLabel}>Your answer: </span>
                    <span>{r.chosen ?? <em>Not answered</em>}</span>
                  </div>
                  {!r.correct && (
                    <div className={`${styles.reviewAnswerRow} ${styles.reviewAnswerCorrect}`}>
                      <span className={styles.reviewAnswerLabel}>Correct answer: </span>
                      <span>{r.question.correctAnswer}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className={styles.reviewActions}>
          <button className="btn-secondary" onClick={() => setScreen(SCREEN.RESULTS)}>Back to Results</button>
          <button className="btn-primary" onClick={init}><RotateCcw size={15} /><span>Retry Quiz</span></button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════
  // RESULTS SCREEN
  // ════════════════════════════════
  if (screen === SCREEN.RESULTS && results) {
    const { score, pct, timeTaken, wasAutoSubmitted, deckBreakdown } = results;
    const grade      = pct >= 90 ? "A" : pct >= 75 ? "B" : pct >= 60 ? "C" : pct >= 50 ? "D" : "F";
    const gradeCol   = gradeColor(pct);
    const wrong      = questions.length - score;
    const isMulti    = selectedDecks.length > 1;

    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => navigate("/dashboard/quizzes")}>
          <ArrowLeft size={16} /> Back to Quizzes
        </button>

        <motion.div
          className={styles.resultsCard}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          {wasAutoSubmitted && (
            <div className={styles.autoSubmitBanner}>
              <AlertTriangle size={15} /> Time's up! Quiz was auto-submitted.
            </div>
          )}

          {/* Multi-deck label */}
          {isMulti && (
            <div className={styles.multiDeckBanner}>
              <BookOpen size={14} />
              {selectedDecks.length} decks · {questions.length} questions
            </div>
          )}

          <motion.div
            className={styles.gradeCircle}
            style={{ borderColor: gradeCol, boxShadow: `0 0 32px ${gradeCol}40` }}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 180 }}
          >
            <span className={styles.gradeLetter} style={{ color: gradeCol }}>{grade}</span>
          </motion.div>

          <h2 className={styles.resultsTitle}>Quiz Complete!</h2>
          <p className={styles.resultsSub}>
            You scored <strong style={{ color: gradeCol }}>{score}/{questions.length}</strong> — {pct}%
          </p>

          <div className={styles.resultsStats}>
            <div className={styles.resStat}>
              <CheckCircle size={18} color="var(--success)" />
              <span className={styles.resStatNum}>{score}</span>
              <span className={styles.resStatLbl}>Correct</span>
            </div>
            <div className={styles.resStat}>
              <XCircle size={18} color="var(--error)" />
              <span className={styles.resStatNum}>{wrong}</span>
              <span className={styles.resStatLbl}>Wrong</span>
            </div>
            <div className={styles.resStat}>
              <Clock size={18} color="var(--purple-light)" />
              <span className={styles.resStatNum}>{formatTime(timeTaken)}</span>
              <span className={styles.resStatLbl}>Time</span>
            </div>
          </div>

          {/* Per-deck breakdown for multi-deck */}
          {isMulti && deckBreakdown.length > 1 && (
            <div className={styles.deckBreakdown}>
              <p className={styles.deckBreakdownTitle}>Per-Deck Breakdown</p>
              {deckBreakdown.map((d) => (
                <div key={d.deckId} className={styles.deckBreakdownRow}>
                  <div className={styles.deckBreakdownLeft}>
                    <BookOpen size={13} style={{ color: "var(--purple-light)", flexShrink: 0 }} />
                    <span className={styles.deckBreakdownName}>{d.deckTitle}</span>
                  </div>
                  <div className={styles.deckBreakdownBar}>
                    <motion.div
                      className={styles.deckBreakdownFill}
                      style={{ background: gradeColor(d.pct) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${d.pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <span className={styles.deckBreakdownPct} style={{ color: gradeColor(d.pct) }}>
                    {d.correct}/{d.total} · {d.pct}%
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.resultsActions}>
            <button className="btn-secondary" onClick={() => navigate("/dashboard/quizzes")}>
              Back to Quizzes
            </button>
            <button className="btn-secondary" onClick={() => setScreen(SCREEN.REVIEW)}>
              <CheckCircle size={15} /><span>Review Answers</span>
            </button>
            <button className="btn-primary" onClick={init}>
              <RotateCcw size={15} /><span>Retry Quiz</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ════════════════════════════════
  // QUIZ SCREEN
  // ════════════════════════════════
  const q            = questions[current];
  const chosenAnswer = answers[current] ?? null;

  return (
    <div className={styles.page}>

      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate("/dashboard/quizzes")}>
          <ArrowLeft size={16} /> Quit
        </button>
        <div className={styles.topMeta}>
          <div className={`${styles.timerPill} ${timerWarning ? styles.timerWarning : ""} ${timerDanger ? styles.timerDanger : ""}`}>
            <Clock size={13} />
            <span>{timeLimit > 0 ? formatTime(timeLeft) : formatTime(elapsed)}</span>
          </div>
          <div className={styles.answeredPill}>
            {answeredCount} / {questions.length} answered
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <motion.div
          className={styles.progressFill}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question navigation panel */}
      <div className={styles.navPanel}>
        <p className={styles.navPanelLabel}>Questions</p>
        <div className={styles.dotsRow}>
          {questions.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot}
                ${i === current    ? styles.dotCurrent  : ""}
                ${answers[i] !== undefined ? styles.dotAnswered : ""}
              `}
              onClick={() => goTo(i)}
              title={`Question ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          className={styles.questionCard}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <div className={styles.questionCardTop}>
            <span className={styles.typeBadge}>
              {q.type === "truefalse" ? "True / False" : "Multiple Choice"}
            </span>
            {/* Deck source tag for multi-deck */}
            {selectedDecks.length > 1 && (
              <span className={styles.deckSourceTag}>
                <BookOpen size={12} /> {q.deckTitle}
              </span>
            )}
          </div>

          <h2 className={styles.questionText}>{q.question}</h2>

          {q.type === "truefalse" && (
            <div className={styles.statementBox}>
              <p className={styles.statementText}>"{q.statement}"</p>
            </div>
          )}

          <div className={`${styles.optionsList} ${q.type === "truefalse" ? styles.optionsTF : ""}`}>
            {q.options.map((option) => {
              const isChosen = chosenAnswer === option;
              return (
                <motion.button
                  key={option}
                  className={`${styles.option} ${isChosen ? styles.optionChosen : ""}`}
                  onClick={() => handleAnswer(option)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <span className={`${styles.optionBullet} ${isChosen ? styles.optionBulletChosen : ""}`} />
                  <span className={styles.optionText}>{option}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation + Submit */}
      <div className={styles.navRow}>
        <button
          className={styles.navBtn}
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
        >
          <ChevronLeft size={17} /> Prev
        </button>

        {current < questions.length - 1 ? (
          <button className={`btn-primary ${styles.nextBtn}`} onClick={() => goTo(current + 1)}>
            Next <ChevronRight size={17} />
          </button>
        ) : (
          <motion.button
            className={`btn-primary ${styles.submitBtn}`}
            onClick={handleSubmit}
            disabled={saving}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {saving
              ? <><Loader size={15} className={styles.spinner} /><span>Submitting...</span></>
              : <><Send size={15} /><span>Submit Quiz</span></>
            }
          </motion.button>
        )}

        <button
          className={styles.navBtn}
          onClick={() => goTo(current + 1)}
          disabled={current === questions.length - 1}
        >
          Next <ChevronRight size={17} />
        </button>
      </div>

      {/* Unanswered warning */}
      {current === questions.length - 1 && unanswered > 0 && (
        <motion.p
          className={styles.unansweredHint}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <AlertTriangle size={13} />
          {unanswered} question{unanswered > 1 ? "s" : ""} still unanswered — will be marked wrong.
        </motion.p>
      )}

    </div>
  );
}
