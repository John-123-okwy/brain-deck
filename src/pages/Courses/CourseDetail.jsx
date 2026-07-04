import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, GraduationCap, BookOpen, Plus,
  Trash2, Play, Loader, AlertCircle,
  Search, X, ClipboardList, Check,
} from "lucide-react";
import { getCourse, addDeckToCourse, removeDeckFromCourse } from "../../services/courseService";
import { getUserDecks } from "../../services/deckService";
import { getQuizHistory } from "../../services/quizService";
import { useAuth } from "../../context/AuthContext";
import styles from "./CourseDetail.module.css";

const colorMap = {
  purple: "#a855f7", indigo: "#6366f1", pink: "#e879f9",
  blue:   "#3b82f6", green:  "#34d399", orange: "#fb923c",
};

function safeNum(v) { const n = Number(v); return isNaN(n) ? 0 : n; }

export default function CourseDetail() {
  const { courseId }    = useParams();
  const navigate        = useNavigate();
  const { currentUser } = useAuth();

  const [course, setCourse]         = useState(null);
  const [allDecks, setAllDecks]     = useState([]);
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [search, setSearch]         = useState("");
  const [adding, setAdding]         = useState(null); // deckId being added
  const [removing, setRemoving]     = useState(null); // deckId being removed

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [c, d, h] = await Promise.all([
        getCourse(courseId),
        getUserDecks(currentUser.uid),
        getQuizHistory(currentUser.uid),
      ]);
      if (!c) { navigate("/dashboard/courses"); return; }
      setCourse(c);
      setAllDecks(d);
      setHistory(h);
    } catch {
      setError("Failed to load course.");
    } finally {
      setLoading(false);
    }
  }, [courseId, currentUser, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Decks inside course
  const courseDecks  = allDecks.filter((d) => course?.deckIds?.includes(d.id));
  // Decks not in course yet
  const outsideDecks = allDecks.filter((d) => !course?.deckIds?.includes(d.id));
  // Filtered outside decks by search
  const filteredOutside = outsideDecks.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const accent = colorMap[course?.color] ?? colorMap.purple;

  // Per-deck avg
  function getDeckAvg(deckId) {
    const dh = history.filter((h) => h.deckId === deckId);
    if (!dh.length) return null;
    return Math.round(dh.reduce((a, h) => a + safeNum(h.percentage), 0) / dh.length);
  }

  // Course overall avg
  const courseAvg = (() => {
    if (!course?.deckIds?.length) return null;
    const relevant = history.filter((h) => course.deckIds.includes(h.deckId));
    if (!relevant.length) return null;
    return Math.round(relevant.reduce((a, h) => a + safeNum(h.percentage), 0) / relevant.length);
  })();

  async function handleAddDeck(deck) {
    try {
      setAdding(deck.id);
      await addDeckToCourse(courseId, deck.id, course.deckIds ?? []);
      setCourse((p) => ({ ...p, deckIds: [...(p.deckIds ?? []), deck.id] }));
    } catch {
      setError("Failed to add deck.");
    } finally {
      setAdding(null);
    }
  }

  async function handleRemoveDeck(deck) {
    try {
      setRemoving(deck.id);
      await removeDeckFromCourse(courseId, deck.id, course.deckIds ?? []);
      setCourse((p) => ({ ...p, deckIds: (p.deckIds ?? []).filter((id) => id !== deck.id) }));
    } catch {
      setError("Failed to remove deck.");
    } finally {
      setRemoving(null);
    }
  }

  if (loading) return (
    <div className={styles.centerState}>
      <Loader size={28} className={styles.spinner} />
      <p>Loading course...</p>
    </div>
  );

  return (
    <div className={styles.page}>

      {/* Back */}
      <motion.button
        className={styles.backBtn}
        onClick={() => navigate("/dashboard/courses")}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      >
        <ArrowLeft size={16} /> Back to Courses
      </motion.button>

      {/* Course banner */}
      <motion.div
        className={styles.banner}
        style={{ "--accent": accent }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.bannerStrip} style={{ background: accent }} />
        <div className={styles.bannerLeft}>
          <div className={styles.bannerIcon} style={{ background: `${accent}25` }}>
            <GraduationCap size={26} style={{ color: accent }} />
          </div>
          <div>
            <p className={styles.bannerSubject}>{course.subject}</p>
            <h1 className={styles.bannerTitle}>{course.title}</h1>
            {course.description && <p className={styles.bannerDesc}>{course.description}</p>}
          </div>
        </div>

        <div className={styles.bannerRight}>
          {/* Stats pills */}
          <div className={styles.bannerStats}>
            <div className={styles.statPill}>
              <BookOpen size={13} />
              <span>{courseDecks.length} {courseDecks.length === 1 ? "deck" : "decks"}</span>
            </div>
            {courseAvg !== null && (
              <div className={styles.statPill} style={{ color: accent, borderColor: `${accent}40`, background: `${accent}15` }}>
                <ClipboardList size={13} />
                <span>Avg: {courseAvg}%</span>
              </div>
            )}
          </div>

          {/* Overall progress bar */}
          {courseAvg !== null && (
            <div className={styles.bannerProgressWrap}>
              <div className={styles.bannerProgressBar}>
                <motion.div
                  className={styles.bannerProgressFill}
                  style={{ background: accent }}
                  initial={{ width: 0 }}
                  animate={{ width: `${courseAvg}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <span className={styles.bannerProgressPct} style={{ color: accent }}>{courseAvg}%</span>
            </div>
          )}

          {/* Study all button */}
          <button
            className={styles.studyAllBtn}
            style={{ background: `${accent}20`, color: accent, borderColor: `${accent}45` }}
            onClick={() => navigate(`/dashboard/courses/${courseId}/study`)}
            disabled={courseDecks.length === 0}
          >
            <Play size={15} fill="currentColor" />
            Study All
          </button>
        </div>
      </motion.div>

      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Section header */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          Decks in this Course
          <span className={styles.sectionCount}>{courseDecks.length}</span>
        </h2>
        <button
          className="btn-primary"
          onClick={() => setShowAddPanel((p) => !p)}
        >
          <Plus size={16} />
          <span>Add Deck</span>
        </button>
      </div>

      {/* Add deck panel */}
      <AnimatePresence>
        {showAddPanel && (
          <motion.div
            className={styles.addPanel}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <div className={styles.addPanelInner}>
              <div className={styles.addPanelHeader}>
                <h3 className={styles.addPanelTitle}>Add a Deck</h3>
                <button className={styles.closePanelBtn} onClick={() => setShowAddPanel(false)}>
                  <X size={16} />
                </button>
              </div>

              {/* Search */}
              <div className={styles.searchWrap}>
                <Search size={15} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search your decks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`input-base ${styles.searchInput}`}
                />
              </div>

              {outsideDecks.length === 0 ? (
                <p className={styles.addPanelEmpty}>All your decks are already in this course.</p>
              ) : filteredOutside.length === 0 ? (
                <p className={styles.addPanelEmpty}>No decks match "{search}"</p>
              ) : (
                <div className={styles.addDeckList}>
                  {filteredOutside.map((deck) => {
                    const da = colorMap[deck.color] ?? colorMap.purple;
                    return (
                      <div key={deck.id} className={styles.addDeckItem}>
                        <div className={styles.addDeckIcon} style={{ background: `${da}20`, color: da }}>
                          <BookOpen size={15} />
                        </div>
                        <div className={styles.addDeckInfo}>
                          <p className={styles.addDeckTitle}>{deck.title}</p>
                          <p className={styles.addDeckSub}>{deck.subject} · {deck.cardCount ?? 0} cards</p>
                        </div>
                        <button
                          className={styles.addDeckBtn}
                          style={{ color: da, borderColor: `${da}40`, background: `${da}15` }}
                          onClick={() => handleAddDeck(deck)}
                          disabled={adding === deck.id}
                        >
                          {adding === deck.id
                            ? <Loader size={13} className={styles.spinner} />
                            : <><Plus size={13} /> Add</>
                          }
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Course decks list */}
      {courseDecks.length === 0 ? (
        <motion.div
          className={styles.emptyState}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={styles.emptyOrb} />
          <BookOpen size={44} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No decks yet</h3>
          <p className={styles.emptySub}>Add decks to this course to start studying them together.</p>
          <button className="btn-primary" onClick={() => setShowAddPanel(true)}>
            <Plus size={16} /><span>Add First Deck</span>
          </button>
        </motion.div>
      ) : (
        <div className={styles.deckList}>
          {courseDecks.map((deck, i) => {
            const da  = colorMap[deck.color] ?? colorMap.purple;
            const avg = getDeckAvg(deck.id);

            return (
              <motion.div
                key={deck.id}
                className={styles.deckItem}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {/* Order number */}
                <div className={styles.deckOrder} style={{ background: `${da}18`, color: da }}>
                  {i + 1}
                </div>

                {/* Icon */}
                <div className={styles.deckIcon} style={{ background: `${da}18`, color: da }}>
                  <BookOpen size={17} />
                </div>

                {/* Info */}
                <div className={styles.deckInfo}>
                  <p className={styles.deckTitle}>{deck.title}</p>
                  <p className={styles.deckSub}>{deck.subject} · {deck.cardCount ?? 0} cards</p>
                </div>

                {/* Avg */}
                {avg !== null && (
                  <div className={styles.deckAvg} style={{ color: da }}>
                    {avg}%
                  </div>
                )}

                {/* Actions */}
                <div className={styles.deckActions}>
                  <button
                    className={styles.studyDeckBtn}
                    style={{ color: da, borderColor: `${da}40`, background: `${da}15` }}
                    onClick={() => navigate(`/dashboard/decks/${deck.id}`)}
                  >
                    <Play size={13} fill="currentColor" /> Open
                  </button>
                  <button
                    className={styles.removeDeckBtn}
                    onClick={() => handleRemoveDeck(deck)}
                    disabled={removing === deck.id}
                    title="Remove from course"
                  >
                    {removing === deck.id
                      ? <Loader size={13} className={styles.spinner} />
                      : <Trash2 size={14} />
                    }
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
