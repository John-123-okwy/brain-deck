import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2, TrendingUp, Clock,
  BookOpen, ClipboardList, Star,
  ChevronRight, ChevronDown, ChevronUp,
  Loader, AlertCircle,
  CheckCircle, XCircle, Trophy,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import { getQuizHistory } from "../../services/quizService";
import { getUserDecks } from "../../services/deckService";
import styles from "./Progress.module.css";

// ── Helpers ──
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" },
});

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
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return "—"; }
}

function safeNum(val) {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
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

const colorMap = {
  purple: "#a855f7", indigo: "#6366f1", pink: "#e879f9",
  blue:   "#3b82f6", green:  "#34d399", orange: "#fb923c",
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className={styles.tooltipValue}>
          {p.name}: {p.value}{p.name === "Score" ? "%" : ""}
        </p>
      ))}
    </div>
  );
}

// ── Tabs config ──
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "bydeck",   label: "By Deck"  },
  { id: "history",  label: "History"  },
];

export default function Progress() {
  const { currentUser } = useAuth();
  const navigate        = useNavigate();

  const [history, setHistory]     = useState([]);
  const [decks, setDecks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // By Deck — which deck row is expanded
  const [expandedDeck, setExpandedDeck] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [h, d] = await Promise.all([
        getQuizHistory(currentUser.uid),
        getUserDecks(currentUser.uid),
      ]);
      setHistory(h);
      setDecks(d);
    } catch {
      setError("Failed to load progress data.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived stats (NaN-safe) ──
  const totalQuizzes = history.length;

  const avgScore = totalQuizzes > 0
    ? Math.round(
        history.reduce((acc, h) => acc + safeNum(h.percentage), 0) / totalQuizzes
      )
    : 0;

  const bestScore = totalQuizzes > 0
    ? Math.max(...history.map((h) => safeNum(h.percentage)))
    : 0;

  const totalTime  = history.reduce((acc, h) => acc + safeNum(h.timeTaken), 0);
  const totalDecks = decks.length;
  const totalCards = decks.reduce((acc, d) => acc + safeNum(d.cardCount), 0);

  // ── Score-over-time chart (last 10 quizzes) ──
  const chartData = [...history]
    .slice(0, 10)
    .reverse()
    .map((h, i) => ({
      name:  `Q${i + 1}`,
      Score: safeNum(h.percentage),
      deck:  h.deckTitle ?? "Unknown",
      date:  formatDate(h.createdAt),
    }));

  // ── Subject breakdown ──
  const subjectMap = {};
  history.forEach((h) => {
    const deck = decks.find((d) => d.id === h.deckId);
    const subj = deck?.subject ?? "General";
    if (!subjectMap[subj]) subjectMap[subj] = { sum: 0, count: 0 };
    subjectMap[subj].sum   += safeNum(h.percentage);
    subjectMap[subj].count += 1;
  });

  const subjectData = Object.entries(subjectMap)
    .map(([name, v]) => ({
      name,
      avg:     Math.round(v.sum / v.count),
      quizzes: v.count,
    }))
    .sort((a, b) => b.avg - a.avg);

  // ── Weekly activity (last 7 days) ──
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const count = history.filter((h) => {
      try {
        const hd = h.createdAt?.toDate ? h.createdAt.toDate() : new Date(h.createdAt ?? 0);
        return hd.toDateString() === d.toDateString();
      } catch { return false; }
    }).length;
    return { name: label, Quizzes: count };
  });

  // ── Per-deck breakdown ──
  const deckBreakdown = decks.map((deck) => {
    const deckHistory = history.filter((h) => h.deckId === deck.id);
    const count       = deckHistory.length;
    const avg         = count > 0
      ? Math.round(deckHistory.reduce((a, h) => a + safeNum(h.percentage), 0) / count)
      : null;
    const best        = count > 0
      ? Math.max(...deckHistory.map((h) => safeNum(h.percentage)))
      : null;
    const lastQuiz    = count > 0 ? deckHistory[0] : null;

    // Mini chart — last 5 quizzes for this deck
    const miniChart = [...deckHistory]
      .slice(0, 5)
      .reverse()
      .map((h, i) => ({ name: `Q${i + 1}`, Score: safeNum(h.percentage) }));

    return { deck, deckHistory, count, avg, best, lastQuiz, miniChart };
  }).sort((a, b) => {
    // Decks with quiz history first, then sort by avg desc
    if (a.count === 0 && b.count > 0) return 1;
    if (b.count === 0 && a.count > 0) return -1;
    return (b.avg ?? 0) - (a.avg ?? 0);
  });

  // ════════════════════════════════
  if (loading) return (
    <div className={styles.centerState}>
      <Loader size={28} className={styles.spinner} />
      <p>Loading your progress...</p>
    </div>
  );

  return (
    <div className={styles.page}>

      {/* ── Page header ── */}
      <motion.div className={styles.pageHeader} {...fadeUp(0)}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <BarChart2 size={22} color="white" />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Progress</h1>
            <p className={styles.pageSub}>Track your learning journey</p>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              className={`${styles.tab} ${activeTab === id ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ════════ OVERVIEW TAB ════════ */}
      {activeTab === "overview" && (
        <>
          {/* Stats grid */}
          <motion.div className={styles.statsGrid} {...fadeUp(0.05)}>
            {[
              { icon: ClipboardList, label: "Quizzes Taken",  value: totalQuizzes,        color: "purple", sub: "total attempts"      },
              { icon: TrendingUp,    label: "Average Score",  value: `${avgScore}%`,       color: "indigo", sub: "across all quizzes"  },
              { icon: Trophy,        label: "Best Score",     value: `${bestScore}%`,      color: "gold",   sub: "personal best"       },
              { icon: Clock,         label: "Time Studied",   value: formatTime(totalTime),color: "pink",   sub: "total quiz time"     },
              { icon: BookOpen,      label: "Total Decks",    value: totalDecks,           color: "green",  sub: "decks created"       },
              { icon: Star,          label: "Total Cards",    value: totalCards,           color: "orange", sub: "flashcards made"     },
            ].map(({ icon: Icon, label, value, color, sub }) => (
              <motion.div
                key={label}
                className={`${styles.statCard} ${styles[`statCard_${color}`]}`}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
              >
                <div className={`${styles.statIcon} ${styles[`statIcon_${color}`]}`}>
                  <Icon size={19} />
                </div>
                <div className={styles.statInfo}>
                  <p className={styles.statValue}>{value}</p>
                  <p className={styles.statLabel}>{label}</p>
                  <p className={styles.statSub}>{sub}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {totalQuizzes === 0 ? (
            <motion.div className={styles.emptyState} {...fadeUp(0.1)}>
              <div className={styles.emptyOrb} />
              <TrendingUp size={44} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>No quiz data yet</h3>
              <p className={styles.emptySub}>
                Take your first quiz to start seeing progress charts here.
              </p>
              <button className="btn-primary" onClick={() => navigate("/dashboard/quizzes")}>
                <span>Take a Quiz</span>
                <ChevronRight size={16} />
              </button>
            </motion.div>
          ) : (
            <>
              {/* Score over time */}
              <motion.div className={styles.chartCard} {...fadeUp(0.1)}>
                <div className={styles.chartHeader}>
                  <div>
                    <h3 className={styles.chartTitle}>Score Over Time</h3>
                    <p className={styles.chartSub}>Your last {chartData.length} quiz scores</p>
                  </div>
                  <div className={styles.avgBadge}>
                    Avg: <strong>{avgScore}%</strong>
                  </div>
                </div>
                <div className={styles.chartWrap}>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="Score"
                        stroke="#a855f7"
                        strokeWidth={2.5}
                        dot={{ fill: "#a855f7", r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "#e879f9" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <div className={styles.twoCol}>

                {/* Weekly activity */}
                <motion.div className={styles.chartCard} {...fadeUp(0.15)}>
                  <div className={styles.chartHeader}>
                    <div>
                      <h3 className={styles.chartTitle}>Weekly Activity</h3>
                      <p className={styles.chartSub}>Quizzes taken this week</p>
                    </div>
                  </div>
                  <div className={styles.chartWrap}>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={weekData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="Quizzes" radius={[6, 6, 0, 0]}>
                          {weekData.map((_, i) => (
                            <Cell key={i} fill={`rgba(168,85,247,${0.35 + i * 0.09})`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Subject breakdown */}
                <motion.div className={styles.chartCard} {...fadeUp(0.2)}>
                  <div className={styles.chartHeader}>
                    <div>
                      <h3 className={styles.chartTitle}>Subject Breakdown</h3>
                      <p className={styles.chartSub}>Average score per subject</p>
                    </div>
                  </div>
                  {subjectData.length === 0 ? (
                    <p className={styles.chartEmpty}>No subject data yet.</p>
                  ) : (
                    <div className={styles.subjectList}>
                      {subjectData.map(({ name, avg, quizzes }) => (
                        <div key={name} className={styles.subjectRow}>
                          <div className={styles.subjectInfo}>
                            <span className={styles.subjectName}>{name}</span>
                            <span className={styles.subjectQuizzes}>{quizzes} quiz{quizzes !== 1 ? "zes" : ""}</span>
                          </div>
                          <div className={styles.subjectBarWrap}>
                            <motion.div
                              className={styles.subjectBar}
                              style={{ background: gradeColor(avg) }}
                              initial={{ width: 0 }}
                              animate={{ width: `${avg}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                          <span className={styles.subjectPct} style={{ color: gradeColor(avg) }}>
                            {avg}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>

              </div>
            </>
          )}
        </>
      )}

      {/* ════════ BY DECK TAB ════════ */}
      {activeTab === "bydeck" && (
        <motion.div className={styles.deckBreakdownList} {...fadeUp(0.05)}>

          {decks.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyOrb} />
              <BookOpen size={44} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>No decks yet</h3>
              <p className={styles.emptySub}>Create a deck and take quizzes to see per-deck progress.</p>
              <button className="btn-primary" onClick={() => navigate("/dashboard/decks")}>
                <span>Create a Deck</span>
                <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            deckBreakdown.map(({ deck, deckHistory, count, avg, best, lastQuiz, miniChart }, i) => {
              const accent     = colorMap[deck.color] ?? colorMap.purple;
              const isExpanded = expandedDeck === deck.id;
              const hasData    = count > 0;

              return (
                <motion.div
                  key={deck.id}
                  className={`${styles.deckCard} ${isExpanded ? styles.deckCardExpanded : ""}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ "--deck-accent": accent }}
                >
                  {/* Top strip */}
                  <div className={styles.deckCardStrip} style={{ background: accent }} />

                  {/* Header row — always visible */}
                  <div
                    className={styles.deckCardHeader}
                    onClick={() => hasData && setExpandedDeck(isExpanded ? null : deck.id)}
                    style={{ cursor: hasData ? "pointer" : "default" }}
                  >
                    {/* Icon + name */}
                    <div className={styles.deckCardLeft}>
                      <div className={styles.deckCardIcon} style={{ background: `${accent}20`, color: accent }}>
                        <BookOpen size={18} />
                      </div>
                      <div>
                        <p className={styles.deckCardTitle}>{deck.title}</p>
                        <p className={styles.deckCardSub}>
                          {deck.subject} · {deck.cardCount ?? 0} cards
                        </p>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className={styles.deckCardStats}>
                      {hasData ? (
                        <>
                          <div className={styles.deckStatPill} style={{ color: gradeColor(avg) }}>
                            <TrendingUp size={13} />
                            <span>Avg: {avg}%</span>
                          </div>
                          <div className={styles.deckStatPill}>
                            <Trophy size={13} />
                            <span>Best: {best}%</span>
                          </div>
                          <div className={styles.deckStatPill}>
                            <ClipboardList size={13} />
                            <span>{count} quiz{count !== 1 ? "zes" : ""}</span>
                          </div>
                        </>
                      ) : (
                        <span className={styles.noQuizLabel}>Not quizzed yet</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className={styles.deckCardActions}>
                      <button
                        className={styles.quizBtn}
                        style={{ color: accent, borderColor: `${accent}40`, background: `${accent}12` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/dashboard/quizzes", { state: { preselectedDeck: deck } });
                        }}
                      >
                        Quiz Now
                      </button>
                      {hasData && (
                        <button className={styles.expandBtn} onClick={(e) => { e.stopPropagation(); setExpandedDeck(isExpanded ? null : deck.id); }}>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mastery bar */}
                  {hasData && (
                    <div className={styles.masteryRow}>
                      <span className={styles.masteryLabel}>Mastery</span>
                      <div className={styles.masteryBarWrap}>
                        <motion.div
                          className={styles.masteryBar}
                          style={{ background: gradeColor(avg) }}
                          initial={{ width: 0 }}
                          animate={{ width: `${avg}%` }}
                          transition={{ duration: 0.9, ease: "easeOut", delay: i * 0.05 }}
                        />
                      </div>
                      <span className={styles.masteryPct} style={{ color: gradeColor(avg) }}>
                        {gradeLetter(avg)}
                      </span>
                    </div>
                  )}

                  {/* Expanded section — mini chart + quiz history */}
                  <AnimatePresence>
                    {isExpanded && hasData && (
                      <motion.div
                        className={styles.deckExpanded}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        <div className={styles.deckExpandedInner}>

                          {/* Mini chart */}
                          {miniChart.length > 1 && (
                            <div className={styles.miniChartWrap}>
                              <p className={styles.miniChartTitle}>Score Trend</p>
                              <ResponsiveContainer width="100%" height={120}>
                                <LineChart data={miniChart} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                                  <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                                  <YAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                                  <Tooltip content={<CustomTooltip />} />
                                  <Line
                                    type="monotone"
                                    dataKey="Score"
                                    stroke={accent}
                                    strokeWidth={2}
                                    dot={{ fill: accent, r: 3, strokeWidth: 0 }}
                                    activeDot={{ r: 5 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          )}

                          {/* Quiz history for this deck */}
                          <div className={styles.deckHistoryList}>
                            <p className={styles.miniChartTitle}>Quiz History</p>
                            {deckHistory.map((item, j) => {
                              const pct   = safeNum(item.percentage);
                              const color = gradeColor(pct);
                              return (
                                <div key={item.id} className={styles.deckHistoryItem}>
                                  <div
                                    className={styles.deckHistoryGrade}
                                    style={{ color, borderColor: color }}
                                  >
                                    {gradeLetter(pct)}
                                  </div>
                                  <div className={styles.deckHistoryInfo}>
                                    <p className={styles.deckHistoryDate}>{formatDate(item.createdAt)}</p>
                                    <p className={styles.deckHistoryTime}>{formatTime(item.timeTaken)}</p>
                                  </div>
                                  <div className={styles.deckHistoryRight}>
                                    <span className={styles.historyCorrect}>
                                      <CheckCircle size={12} color="var(--success)" /> {item.score}
                                    </span>
                                    <span className={styles.historyWrong}>
                                      <XCircle size={12} color="var(--error)" /> {safeNum(item.total) - safeNum(item.score)}
                                    </span>
                                    <span className={styles.deckHistoryScore} style={{ color }}>
                                      {pct}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>
              );
            })
          )}
        </motion.div>
      )}

      {/* ════════ HISTORY TAB ════════ */}
      {activeTab === "history" && (
        <motion.div {...fadeUp(0.05)}>
          {history.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyOrb} />
              <ClipboardList size={44} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>No quiz history yet</h3>
              <p className={styles.emptySub}>Your completed quizzes will appear here.</p>
              <button className="btn-primary" onClick={() => navigate("/dashboard/quizzes")}>
                <span>Take a Quiz</span>
                <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <div className={styles.historyList}>
              {history.map((item, i) => {
                const pct   = safeNum(item.percentage);
                const color = gradeColor(pct);
                const grade = gradeLetter(pct);
                return (
                  <motion.div
                    key={item.id}
                    className={styles.historyItem}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <div
                      className={styles.historyGrade}
                      style={{ borderColor: color, color, boxShadow: `0 0 12px ${color}30` }}
                    >
                      {grade}
                    </div>
                    <div className={styles.historyInfo}>
                      <p className={styles.historyDeck}>{item.deckTitle ?? "Unknown Deck"}</p>
                      <p className={styles.historyMeta}>
                        {formatDate(item.createdAt)} · {formatTime(item.timeTaken)}
                      </p>
                    </div>
                    <div className={styles.historyStats}>
                      <span className={styles.historyCorrect}>
                        <CheckCircle size={13} color="var(--success)" /> {safeNum(item.score)}
                      </span>
                      <span className={styles.historyWrong}>
                        <XCircle size={13} color="var(--error)" /> {safeNum(item.total) - safeNum(item.score)}
                      </span>
                    </div>
                    <div className={styles.historyScore} style={{ color }}>
                      {pct}%
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

    </div>
  );
}
