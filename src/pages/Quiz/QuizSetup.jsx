import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, BookOpen, ChevronRight, GraduationCap,
  Loader, AlertCircle, CheckSquare, ToggleLeft,
  Clock, Hash, X, Check, AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getUserDecks } from "../../services/deckService";
import { getUserCourses } from "../../services/courseService";
import { getCards } from "../../services/cardService";
import styles from "./QuizSetup.module.css";

const QUESTION_PRESETS = [5, 10, 20, 50];
const TIME_PRESETS = [
  { label: "None", value: 0  },
  { label: "5m",   value: 5  },
  { label: "15m",  value: 15 },
  { label: "30m",  value: 30 },
  { label: "45m",  value: 45 },
  { label: "60m",  value: 60 },
];
const TYPE_OPTIONS = [
  { id: "multiplechoice", label: "Multiple Choice", icon: CheckSquare, desc: "Pick the correct answer from 4 options" },
  { id: "truefalse",      label: "True / False",    icon: ToggleLeft,   desc: "Decide if the statement is correct" },
];
const colorMap = {
  purple: "#a855f7", indigo: "#6366f1", pink: "#e879f9",
  blue:   "#3b82f6", green:  "#34d399", orange: "#fb923c",
};

export default function QuizSetup() {
  const { currentUser } = useAuth();
  const navigate        = useNavigate();
  const location        = useLocation();

  const [decks, setDecks]     = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Multi-deck selection — { [deckId]: { deck, cardCount } }
  const [selectedDecks, setSelectedDecks] = useState({});
  const [cardCounts, setCardCounts]       = useState({}); // { [deckId]: number }
  const [loadingCards, setLoadingCards]   = useState({}); // { [deckId]: bool }

  // Course quick-select dropdown
  const [courseDropdown, setCourseDropdown] = useState(false);

  // Question count
  const [questionPreset, setQuestionPreset] = useState(10);
  const [questionCustom, setQuestionCustom] = useState("");
  const [useAllCards, setUseAllCards]       = useState(false);

  // Time limit
  const [timePreset, setTimePreset] = useState(0);
  const [timeCustom, setTimeCustom] = useState("");

  // Question types
  const [types, setTypes] = useState(["multiplechoice", "truefalse"]);

  // ── Fetch decks + courses ──
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [d, c] = await Promise.all([
        getUserDecks(currentUser.uid),
        getUserCourses(currentUser.uid),
      ]);
      setDecks(d);
      setCourses(c);
    } catch {
      setError("Failed to load decks.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Pre-select deck if navigated from Progress "By Deck" ──
  useEffect(() => {
    if (location.state?.preselectedDeck) {
      const deck = location.state.preselectedDeck;
      handleToggleDeck(deck);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decks]);

  // ── Toggle a deck on/off ──
  async function handleToggleDeck(deck) {
    if (selectedDecks[deck.id]) {
      // Deselect
      setSelectedDecks((p) => { const n = { ...p }; delete n[deck.id]; return n; });
      return;
    }

    // Select — fetch card count if not cached
    setSelectedDecks((p) => ({ ...p, [deck.id]: deck }));

    if (cardCounts[deck.id] !== undefined) return;

    try {
      setLoadingCards((p) => ({ ...p, [deck.id]: true }));
      const cards = await getCards(deck.id);
      setCardCounts((p) => ({ ...p, [deck.id]: cards.length }));
    } catch {
      setCardCounts((p) => ({ ...p, [deck.id]: 0 }));
    } finally {
      setLoadingCards((p) => ({ ...p, [deck.id]: false }));
    }
  }

  // ── Select all decks from a course ──
  async function handleSelectCourse(course) {
    setCourseDropdown(false);
    if (!course.deckIds?.length) return;

    const courseDecks = decks.filter((d) => course.deckIds.includes(d.id));

    // Add all course decks
    const newSelected = { ...selectedDecks };
    courseDecks.forEach((d) => { newSelected[d.id] = d; });
    setSelectedDecks(newSelected);

    // Fetch card counts for uncached decks
    const uncached = courseDecks.filter((d) => cardCounts[d.id] === undefined);
    if (!uncached.length) return;

    setLoadingCards((p) => {
      const n = { ...p };
      uncached.forEach((d) => { n[d.id] = true; });
      return n;
    });

    await Promise.all(uncached.map(async (deck) => {
      try {
        const cards = await getCards(deck.id);
        setCardCounts((p) => ({ ...p, [deck.id]: cards.length }));
      } catch {
        setCardCounts((p) => ({ ...p, [deck.id]: 0 }));
      } finally {
        setLoadingCards((p) => ({ ...p, [deck.id]: false }));
      }
    }));
  }

  // ── Clear all selections ──
  function clearAll() {
    setSelectedDecks({});
    setQuestionPreset(10);
    setQuestionCustom("");
    setUseAllCards(false);
  }

  // ── Derived ──
  const selectedDeckList   = Object.values(selectedDecks);
  const selectedCount      = selectedDeckList.length;
  const totalAvailableCards = selectedDeckList.reduce((a, d) => a + (cardCounts[d.id] ?? 0), 0);

  // Valid decks = selected AND have >= 2 cards
  const validDecks    = selectedDeckList.filter((d) => (cardCounts[d.id] ?? 0) >= 2);
  const invalidDecks  = selectedDeckList.filter((d) => {
    const count = cardCounts[d.id];
    return count !== undefined && count < 2;
  });
  const validCardPool = validDecks.reduce((a, d) => a + (cardCounts[d.id] ?? 0), 0);

  const finalQuestionCount = useAllCards
    ? validCardPool
    : questionCustom !== ""
      ? Math.min(parseInt(questionCustom) || 1, validCardPool)
      : Math.min(questionPreset, validCardPool);

  const finalTimeLimit = timeCustom !== ""
    ? parseInt(timeCustom) || 0
    : timePreset;

  const canStart =
    validDecks.length > 0 &&
    validCardPool >= 2 &&
    types.length > 0 &&
    finalQuestionCount >= 1 &&
    finalQuestionCount <= validCardPool &&
    (finalTimeLimit === 0 || finalTimeLimit >= 1);

  // ── Question count handlers ──
  function handleQuestionPreset(n) {
    setQuestionPreset(n);
    setQuestionCustom("");
    setUseAllCards(false);
  }

  function handleAllCards() {
    setUseAllCards(true);
    setQuestionCustom("");
    setQuestionPreset(null);
  }

  function handleQuestionCustom(val) {
    setQuestionCustom(val.replace(/\D/g, ""));
    setQuestionPreset(null);
    setUseAllCards(false);
  }

  // ── Time handlers ──
  function handleTimePreset(val) { setTimePreset(val); setTimeCustom(""); }
  function handleTimeCustom(val) { setTimeCustom(val.replace(/\D/g, "")); setTimePreset(null); }

  // ── Type toggle ──
  function toggleType(id) {
    setTypes((prev) =>
      prev.includes(id)
        ? prev.length === 1 ? prev : prev.filter((t) => t !== id)
        : [...prev, id]
    );
  }

  // ── Start ──
  function handleStart() {
    if (!canStart) return;
    // Pass all valid selected decks + their card counts
    navigate("/dashboard/quizzes/session", {
      state: {
        selectedDecks:  validDecks,
        cardCounts,
        questionCount:  finalQuestionCount,
        timeLimit:      finalTimeLimit,
        types,
      },
    });
  }

  return (
    <div className={styles.page}>

      {/* Page header */}
      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.headerIcon}>
          <ClipboardList size={22} color="white" />
        </div>
        <div>
          <h1 className={styles.pageTitle}>Quiz Setup</h1>
          <p className={styles.pageSub}>Configure your quiz session</p>
        </div>
      </motion.div>

      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className={styles.grid}>

        {/* ── Step 1: Pick decks ── */}
        <motion.div
          className={styles.section}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={styles.stepBadge}>1</div>
          <h2 className={styles.sectionTitle}>Choose Decks</h2>
          <p className={styles.sectionSub}>Select one or more decks to quiz from</p>

          {/* Course quick-select */}
          {courses.length > 0 && (
            <div className={styles.courseSelect}>
              <button
                className={styles.courseSelectBtn}
                onClick={() => setCourseDropdown((p) => !p)}
              >
                <GraduationCap size={15} />
                <span>Add all decks from a course</span>
                <ChevronRight size={14} className={`${styles.courseSelectChevron} ${courseDropdown ? styles.courseSelectChevronOpen : ""}`} />
              </button>
              <AnimatePresence>
                {courseDropdown && (
                  <motion.div
                    className={styles.courseDropdown}
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                  >
                    {courses.map((course) => {
                      const accent = colorMap[course.color] ?? colorMap.purple;
                      return (
                        <button
                          key={course.id}
                          className={styles.courseDropdownItem}
                          onClick={() => handleSelectCourse(course)}
                        >
                          <div className={styles.courseDropdownIcon} style={{ background: `${accent}20`, color: accent }}>
                            <GraduationCap size={14} />
                          </div>
                          <div className={styles.courseDropdownInfo}>
                            <p className={styles.courseDropdownTitle}>{course.title}</p>
                            <p className={styles.courseDropdownSub}>{course.deckIds?.length ?? 0} decks</p>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Selected count + clear */}
          {selectedCount > 0 && (
            <div className={styles.selectionBar}>
              <span className={styles.selectionCount}>
                <Check size={13} /> {selectedCount} deck{selectedCount !== 1 ? "s" : ""} selected · {validCardPool} cards
              </span>
              <button className={styles.clearBtn} onClick={clearAll}>
                <X size={13} /> Clear
              </button>
            </div>
          )}

          {loading ? (
            <div className={styles.loadingRow}>
              <Loader size={20} className={styles.spinner} />
              <span>Loading decks...</span>
            </div>
          ) : decks.length === 0 ? (
            <div className={styles.emptyDecks}>
              <BookOpen size={28} style={{ opacity: 0.3, color: "var(--text-muted)" }} />
              <p>No decks yet. Create a deck first.</p>
              <button className="btn-primary" onClick={() => navigate("/dashboard/decks")}>
                <span>Go to Decks</span>
              </button>
            </div>
          ) : (
            <div className={styles.deckList}>
              {decks.map((deck) => {
                const accent     = colorMap[deck.color] ?? colorMap.purple;
                const isSelected = !!selectedDecks[deck.id];
                const count      = cardCounts[deck.id];
                const isLoading  = loadingCards[deck.id];
                const tooFew     = count !== undefined && count < 2;

                return (
                  <motion.button
                    key={deck.id}
                    className={`${styles.deckOption}
                      ${isSelected ? styles.deckOptionActive : ""}
                      ${tooFew ? styles.deckOptionInvalid : ""}
                    `}
                    style={isSelected ? { borderColor: accent, boxShadow: `0 0 14px ${accent}28` } : {}}
                    onClick={() => handleToggleDeck(deck)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {/* Checkbox */}
                    <div
                      className={`${styles.checkbox} ${isSelected ? styles.checkboxActive : ""}`}
                      style={isSelected ? { background: accent, borderColor: accent } : {}}
                    >
                      {isSelected && <Check size={11} color="white" />}
                    </div>

                    <div className={styles.deckOptionIcon} style={{ background: `${accent}20`, color: accent }}>
                      <BookOpen size={15} />
                    </div>

                    <div className={styles.deckOptionInfo}>
                      <p className={styles.deckOptionTitle}>{deck.title}</p>
                      <p className={styles.deckOptionSub}>{deck.subject}</p>
                    </div>

                    {/* Card count badge */}
                    <div className={styles.deckCountBadge}>
                      {isLoading ? (
                        <Loader size={12} className={styles.spinner} />
                      ) : count !== undefined ? (
                        <span style={{ color: tooFew ? "var(--error)" : "var(--text-muted)" }}>
                          {count} cards
                          {tooFew && " ⚠️"}
                        </span>
                      ) : (
                        <span>{deck.cardCount ?? 0} cards</span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Invalid deck warnings */}
          {invalidDecks.length > 0 && (
            <div className={styles.warningText}>
              <AlertTriangle size={13} />
              {invalidDecks.map((d) => d.title).join(", ")} {invalidDecks.length === 1 ? "needs" : "need"} at least 2 cards and will be skipped.
            </div>
          )}
        </motion.div>

        {/* ── Right column ── */}
        <div className={styles.rightCol}>

          {/* Step 2: Question count */}
          <motion.div
            className={styles.section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className={styles.stepBadge}>2</div>
            <div className={styles.sectionTitleRow}>
              <Hash size={15} className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>Number of Questions</h2>
            </div>
            <p className={styles.sectionSub}>
              {validCardPool > 0
                ? `${validCardPool} cards available across selected decks`
                : "Select at least one deck first"}
            </p>

            <div className={styles.presetRow}>
              {QUESTION_PRESETS.map((n) => {
                const disabled = validCardPool < n;
                const isActive = !useAllCards && questionCustom === "" && questionPreset === n;
                return (
                  <button
                    key={n}
                    className={`${styles.presetBtn} ${isActive ? styles.presetBtnActive : ""} ${disabled ? styles.presetBtnDisabled : ""}`}
                    onClick={() => !disabled && handleQuestionPreset(n)}
                    disabled={disabled}
                  >
                    {n}
                  </button>
                );
              })}
              <button
                className={`${styles.presetBtn} ${useAllCards ? styles.presetBtnActive : ""} ${validCardPool < 2 ? styles.presetBtnDisabled : ""}`}
                onClick={() => validCardPool >= 2 && handleAllCards()}
                disabled={validCardPool < 2}
              >
                All
              </button>
            </div>

            <div className={styles.customInputRow}>
              <span className={styles.customLabel}>Custom:</span>
              <input
                type="number" min={1} max={validCardPool || 999}
                placeholder="e.g. 35"
                value={questionCustom}
                onChange={(e) => handleQuestionCustom(e.target.value)}
                className={`input-base ${styles.customInput} ${questionCustom !== "" ? styles.customInputActive : ""}`}
                disabled={validCardPool < 2}
              />
              <span className={styles.customSuffix}>questions</span>
            </div>

            {validCardPool > 0 && (
              <p className={styles.previewText}>
                Quiz will have{" "}
                <strong style={{ color: "var(--purple-light)" }}>
                  {finalQuestionCount || "—"}
                </strong>{" "}
                question{finalQuestionCount !== 1 ? "s" : ""}
                {finalQuestionCount > validCardPool && (
                  <span style={{ color: "var(--error)" }}> (exceeds available cards)</span>
                )}
              </p>
            )}
          </motion.div>

          {/* Step 3: Time limit */}
          <motion.div
            className={styles.section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={styles.stepBadge}>3</div>
            <div className={styles.sectionTitleRow}>
              <Clock size={15} className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>Time Limit</h2>
            </div>
            <p className={styles.sectionSub}>Set a countdown timer for your quiz</p>

            <div className={styles.presetRow}>
              {TIME_PRESETS.map(({ label, value }) => {
                const isActive = timeCustom === "" && timePreset === value;
                return (
                  <button
                    key={label}
                    className={`${styles.presetBtn} ${isActive ? styles.presetBtnActive : ""}`}
                    onClick={() => handleTimePreset(value)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className={styles.customInputRow}>
              <span className={styles.customLabel}>Custom:</span>
              <input
                type="number" min={1} max={300}
                placeholder="e.g. 45"
                value={timeCustom}
                onChange={(e) => handleTimeCustom(e.target.value)}
                className={`input-base ${styles.customInput} ${timeCustom !== "" ? styles.customInputActive : ""}`}
              />
              <span className={styles.customSuffix}>minutes</span>
            </div>

            <p className={styles.previewText}>
              {finalTimeLimit === 0
                ? "No time limit — take as long as you need"
                : <>Timer set to <strong style={{ color: "var(--purple-light)" }}>{finalTimeLimit} minute{finalTimeLimit !== 1 ? "s" : ""}</strong></>
              }
            </p>
          </motion.div>

          {/* Step 4: Question types */}
          <motion.div
            className={styles.section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className={styles.stepBadge}>4</div>
            <h2 className={styles.sectionTitle}>Question Types</h2>
            <p className={styles.sectionSub}>Choose one or both types</p>

            <div className={styles.typeList}>
              {TYPE_OPTIONS.map(({ id, label, icon: Icon, desc }) => {
                const active = types.includes(id);
                return (
                  <button
                    key={id}
                    className={`${styles.typeBtn} ${active ? styles.typeBtnActive : ""}`}
                    onClick={() => toggleType(id)}
                  >
                    <div className={`${styles.typeIcon} ${active ? styles.typeIconActive : ""}`}>
                      <Icon size={17} />
                    </div>
                    <div className={styles.typeInfo}>
                      <p className={styles.typeLabel}>{label}</p>
                      <p className={styles.typeDesc}>{desc}</p>
                    </div>
                    <div className={`${styles.typeCheck} ${active ? styles.typeCheckActive : ""}`} />
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Start button */}
          <motion.button
            className={`btn-primary ${styles.startBtn}`}
            onClick={handleStart}
            disabled={!canStart}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={canStart ? { scale: 1.02 } : {}}
            whileTap={canStart ? { scale: 0.98 } : {}}
          >
            <span>Start Quiz</span>
            <ChevronRight size={18} />
          </motion.button>

        </div>
      </div>
    </div>
  );
}
