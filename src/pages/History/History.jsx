import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  History as HistoryIcon, ClipboardList, BookOpen,
  Clock, CheckCircle, XCircle, TrendingUp,
  Loader, AlertCircle, Filter, ChevronRight,
  Trophy, Layers,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getQuizHistory } from "../../services/quizService";
import { getStudyHistory } from "../../services/historyService";
import styles from "./History.module.css";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" },
});

function safeNum(v) { const n = Number(v); return isNaN(n) ? 0 : n; }

function formatTime(s) {
  if (!s || isNaN(s)) return "0:00";
  const m   = Math.floor(Math.abs(s) / 60);
  const sec = Math.abs(s) % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatDate(ts) {
  if (!ts) return "—";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-US", {
      month: "short", day: "numeric",
      year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
}

function gradeColor(pct) {
  if (pct >= 75) return "var(--success)";
  if (pct >= 50) return "var(--warning)";
  return "var(--error)";
}

function gradeLetter(pct) {
  if (pct >= 90) return "A";
  if (pct >= 75) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

const TABS = [
  { id: "all",   label: "All Activity" },
  { id: "quiz",  label: "Quizzes" },
  { id: "study", label: "Study Sessions" },
];

const FILTERS = [
  { id: "all",   label: "All time" },
  { id: "today", label: "Today" },
  { id: "week",  label: "This week" },
  { id: "month", label: "This month" },
];

export default function History() {
  const { currentUser } = useAuth();
  const navigate        = useNavigate();

  const [quizHistory, setQuizHistory]   = useState([]);
  const [studyHistory, setStudyHistory] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [activeTab, setActiveTab]       = useState("all");
  const [dateFilter, setDateFilter]     = useState("all");
  const [showFilter, setShowFilter]     = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [qh, sh] = await Promise.all([
        getQuizHistory(currentUser.uid),
        getStudyHistory(currentUser.uid),
      ]);
      setQuizHistory(qh);
      setStudyHistory(sh);
    } catch {
      setError("Failed to load history.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Date filter helper ──
  function isWithinFilter(ts) {
    if (dateFilter === "all") return true;
    try {
      const d    = ts?.toDate ? ts.toDate() : new Date(ts ?? 0);
      const now  = new Date();
      const diff = now - d;
      if (dateFilter === "today") return diff < 86400000;
      if (dateFilter === "week")  return diff < 604800000;
      if (dateFilter === "month") return diff < 2592000000;
    } catch { return false; }
    return false;
  }

  // ── Build combined timeline ──
  const quizItems  = quizHistory
    .filter((h) => isWithinFilter(h.createdAt))
    .map((h) => ({ ...h, _type: "quiz" }));

  const studyItems = studyHistory
    .filter((h) => isWithinFilter(h.createdAt))
    .map((h) => ({ ...h, _type: "study" }));

  const allItems = [...quizItems, ...studyItems].sort((a, b) => {
    const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt ?? 0);
    const db_ = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt ?? 0);
    return db_ - da;
  });

  const displayItems =
    activeTab === "all"   ? allItems  :
    activeTab === "quiz"  ? quizItems :
    studyItems;

  // ── Summary stats ──
  const totalQuizzes    = quizHistory.length;
  const avgScore        = totalQuizzes > 0
    ? Math.round(quizHistory.reduce((a, h) => a + safeNum(h.percentage), 0) / totalQuizzes)
    : 0;
  const totalStudy      = studyHistory.length;
  const totalTime       = [
    ...quizHistory.map((h) => safeNum(h.timeTaken)),
    ...studyHistory.map((h) => safeNum(h.duration)),
  ].reduce((a, b) => a + b, 0);

  return (
    <div className={styles.page}>

      {/* Page header */}
      <motion.div className={styles.pageHeader} {...fadeUp(0)}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <HistoryIcon size={22} color="white" />
          </div>
          <div>
            <h1 className={styles.pageTitle}>My History</h1>
            <p className={styles.pageSub}>Your complete learning activity</p>
          </div>
        </div>

        {/* Filter button */}
        <div className={styles.filterWrap}>
          <button
            className={`${styles.filterBtn} ${showFilter ? styles.filterBtnActive : ""}`}
            onClick={() => setShowFilter((p) => !p)}
          >
            <Filter size={14} />
            <span>{FILTERS.find((f) => f.id === dateFilter)?.label}</span>
          </button>

          <AnimatePresence>
            {showFilter && (
              <motion.div
                className={styles.filterDropdown}
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.18 }}
              >
                {FILTERS.map(({ id, label }) => (
                  <button
                    key={id}
                    className={`${styles.filterOption} ${dateFilter === id ? styles.filterOptionActive : ""}`}
                    onClick={() => { setDateFilter(id); setShowFilter(false); }}
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Summary stats */}
      <motion.div className={styles.statsRow} {...fadeUp(0.05)}>
        {[
          { icon: ClipboardList, label: "Quizzes",       value: totalQuizzes,        color: "purple" },
          { icon: TrendingUp,    label: "Avg Score",      value: `${avgScore}%`,      color: "indigo" },
          { icon: BookOpen,      label: "Study Sessions", value: totalStudy,          color: "green"  },
          { icon: Clock,         label: "Time Spent",     value: formatTime(totalTime), color: "pink" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className={`${styles.statCard} ${styles[`statCard_${color}`]}`}>
            <div className={`${styles.statIcon} ${styles[`statIcon_${color}`]}`}>
              <Icon size={17} />
            </div>
            <div>
              <p className={styles.statValue}>{value}</p>
              <p className={styles.statLabel}>{label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div className={styles.tabs} {...fadeUp(0.08)}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            className={`${styles.tab} ${activeTab === id ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {/* Activity list */}
      {loading ? (
        <div className={styles.centerState}>
          <Loader size={28} className={styles.spinner} />
          <p>Loading history...</p>
        </div>
      ) : displayItems.length === 0 ? (
        <motion.div
          className={styles.emptyState}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={styles.emptyOrb} />
          <HistoryIcon size={44} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No activity yet</h3>
          <p className={styles.emptySub}>
            {activeTab === "quiz"  ? "Take a quiz to see your results here." :
             activeTab === "study" ? "Study a deck to see your sessions here." :
             "Complete quizzes or study sessions to see your history here."}
          </p>
          <button
            className="btn-primary"
            onClick={() => navigate(activeTab === "study" ? "/dashboard/decks" : "/dashboard/quizzes")}
          >
            <span>{activeTab === "study" ? "Go to Decks" : "Take a Quiz"}</span>
            <ChevronRight size={15} />
          </button>
        </motion.div>
      ) : (
        <motion.div
          className={styles.activityList}
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.04 } } }}
        >
          {displayItems.map((item, i) => (
            <motion.div
              key={item.id}
              className={styles.activityItem}
              variants={{
                initial: { opacity: 0, y: 12 },
                animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
              }}
            >
              {item._type === "quiz" ? (
                <QuizHistoryItem item={item} navigate={navigate} />
              ) : (
                <StudyHistoryItem item={item} navigate={navigate} />
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ── Quiz history item ──
function QuizHistoryItem({ item, navigate }) {
  const pct   = safeNum(item.percentage);
  const color = gradeColor(pct);
  const grade = gradeLetter(pct);

  return (
    <div
      className={styles.historyCard}
      onClick={() => navigate("/dashboard/progress")}
    >
      {/* Left — grade badge */}
      <div
        className={styles.gradeBadge}
        style={{ borderColor: color, color, boxShadow: `0 0 12px ${color}30` }}
      >
        {grade}
      </div>

      {/* Center — info */}
      <div className={styles.historyInfo}>
        <div className={styles.historyTitleRow}>
          <ClipboardList size={14} style={{ color: "var(--indigo-accent)" }} />
          <p className={styles.historyTitle}>{item.deckTitle ?? "Quiz"}</p>
          <span className={styles.typePill} style={{ background: "rgba(99,102,241,0.1)", color: "var(--indigo-accent)" }}>
            Quiz
          </span>
        </div>
        <p className={styles.historyMeta}>{formatDate(item.createdAt)}</p>
        <div className={styles.historyStats}>
          <span className={styles.historyStat}>
            <CheckCircle size={12} color="var(--success)" />
            {safeNum(item.score)} correct
          </span>
          <span className={styles.historyStat}>
            <XCircle size={12} color="var(--error)" />
            {safeNum(item.total) - safeNum(item.score)} wrong
          </span>
          <span className={styles.historyStat}>
            <Clock size={12} color="var(--text-muted)" />
            {formatTime(item.timeTaken)}
          </span>
        </div>
      </div>

      {/* Right — score */}
      <div className={styles.historyScore} style={{ color }}>
        {pct}%
      </div>
    </div>
  );
}

// ── Study session item ──
function StudyHistoryItem({ item, navigate }) {
  const known    = safeNum(item.knownCount);
  const learning = safeNum(item.learningCount);
  const total    = safeNum(item.cardCount);
  const pct      = total > 0 ? Math.round((known / total) * 100) : 0;

  return (
    <div
      className={styles.historyCard}
      onClick={() => item.deckId && navigate(`/dashboard/decks/${item.deckId}`)}
    >
      {/* Left — icon */}
      <div className={styles.studyBadge}>
        <BookOpen size={20} style={{ color: "var(--purple-light)" }} />
      </div>

      {/* Center — info */}
      <div className={styles.historyInfo}>
        <div className={styles.historyTitleRow}>
          <Layers size={14} style={{ color: "var(--purple-light)" }} />
          <p className={styles.historyTitle}>{item.deckTitle ?? "Study Session"}</p>
          <span className={styles.typePill} style={{ background: "rgba(168,85,247,0.1)", color: "var(--purple-light)" }}>
            Study
          </span>
        </div>
        <p className={styles.historyMeta}>{formatDate(item.createdAt)}</p>
        <div className={styles.historyStats}>
          <span className={styles.historyStat}>
            <CheckCircle size={12} color="var(--success)" />
            {known} known
          </span>
          <span className={styles.historyStat}>
            <XCircle size={12} color="var(--error)" />
            {learning} learning
          </span>
          <span className={styles.historyStat}>
            <Clock size={12} color="var(--text-muted)" />
            {formatTime(item.duration)}
          </span>
        </div>
      </div>

      {/* Right — mastery */}
      <div className={styles.historyScore} style={{ color: gradeColor(pct) }}>
        {total > 0 ? `${pct}%` : "—"}
      </div>
    </div>
  );
}
