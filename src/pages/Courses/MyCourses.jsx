import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, GraduationCap, BookOpen, Loader,
  AlertCircle, MoreVertical, Edit2, Trash2,
  Play, X, BarChart2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getUserCourses, createCourse, updateCourse, deleteCourse,
} from "../../services/courseService";
import { getQuizHistory } from "../../services/quizService";
import CourseFormModal from "../../components/courses/CourseFormModal";
import styles from "./MyCourses.module.css";

const colorMap = {
  purple: "#a855f7", indigo: "#6366f1", pink: "#e879f9",
  blue:   "#3b82f6", green:  "#34d399", orange: "#fb923c",
};

function safeNum(v) { const n = Number(v); return isNaN(n) ? 0 : n; }

export default function MyCourses() {
  const { currentUser } = useAuth();
  const navigate        = useNavigate();

  const [courses, setCourses]         = useState([]);
  const [history, setHistory]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [modalOpen, setModalOpen]     = useState(false);
  const [editCourse, setEditCourse]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [menuOpen, setMenuOpen]       = useState(null); // course id

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [c, h] = await Promise.all([
        getUserCourses(currentUser.uid),
        getQuizHistory(currentUser.uid),
      ]);
      setCourses(c);
      setHistory(h);
    } catch {
      setError("Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e) {
      // Only close if clicking outside a menu item
      if (!e.target.closest('[data-menu]')) setMenuOpen(null);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  async function handleCreate(data) {
    await createCourse(currentUser.uid, data);
    await fetchAll();
  }

  async function handleEdit(data) {
    await updateCourse(editCourse.id, data);
    await fetchAll();
    setEditCourse(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteCourse(deleteTarget.id);
      setCourses((p) => p.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete course.");
    } finally {
      setDeleting(false);
    }
  }

  // Get average quiz score for all decks in this course
  function getCourseAvg(course) {
    if (!course.deckIds?.length) return null;
    const relevant = history.filter((h) => course.deckIds.includes(h.deckId));
    if (!relevant.length) return null;
    return Math.round(relevant.reduce((a, h) => a + safeNum(h.percentage), 0) / relevant.length);
  }

  return (
    <div className={styles.page}>

      {/* ── Page header ── */}
      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <GraduationCap size={22} color="white" />
          </div>
          <div>
            <h1 className={styles.pageTitle}>My Courses</h1>
            <p className={styles.pageSub}>
              {courses.length} {courses.length === 1 ? "course" : "courses"} created
            </p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => { setEditCourse(null); setModalOpen(true); }}>
          <Plus size={17} /><span>New Course</span>
        </button>
      </motion.div>

      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className={styles.centerState}>
          <Loader size={28} className={styles.spinner} />
          <p>Loading courses...</p>
        </div>
      ) : courses.length === 0 ? (
        /* Empty state */
        <motion.div
          className={styles.emptyState}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={styles.emptyOrb} />
          <GraduationCap size={52} className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>No courses yet</h2>
          <p className={styles.emptySub}>
            Create a course to group your decks together. Study them in sequence and track progress per course.
          </p>
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={17} /><span>Create First Course</span>
          </button>
        </motion.div>
      ) : (
        <motion.div className={styles.grid} layout>
          <AnimatePresence>
            {courses.map((course, i) => {
              const accent  = colorMap[course.color] ?? colorMap.purple;
              const avg     = getCourseAvg(course);
              const deckCount = course.deckIds?.length ?? 0;

              return (
                <motion.div
                  key={course.id}
                  className={styles.courseCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                  layout
                >
                  {/* Top strip */}
                  <div className={styles.strip} style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />

                  {/* Card header */}
                  <div className={styles.cardHeader}>
                    <div className={styles.cardIcon} style={{ background: `${accent}20`, color: accent }}>
                      <GraduationCap size={20} />
                    </div>

                    {/* 3-dot menu */}
                    <div className={styles.menuWrap} data-menu="true" onClick={(e) => e.stopPropagation()}>
                      <button
                        className={styles.menuBtn}
                        onClick={() => setMenuOpen(menuOpen === course.id ? null : course.id)}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {menuOpen === course.id && (
                        <motion.div
                          className={styles.menu}
                          initial={{ opacity: 0, scale: 0.92, y: -6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <button
                            className={styles.menuItem}
                            onClick={() => { setEditCourse(course); setModalOpen(true); setMenuOpen(null); }}
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button
                            className={`${styles.menuItem} ${styles.menuItemDelete}`}
                            onClick={() => { setDeleteTarget(course); setMenuOpen(null); }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className={styles.cardBody}>
                    <span className={styles.subject}>{course.subject}</span>
                    <h3 className={styles.cardTitle}>{course.title}</h3>
                    {course.description && (
                      <p className={styles.cardDesc}>{course.description}</p>
                    )}
                  </div>

                  {/* Progress bar */}
                  {avg !== null && (
                    <div className={styles.progressRow}>
                      <div className={styles.progressBarWrap}>
                        <motion.div
                          className={styles.progressBarFill}
                          style={{ background: accent }}
                          initial={{ width: 0 }}
                          animate={{ width: `${avg}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                      <span className={styles.progressPct} style={{ color: accent }}>{avg}%</span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className={styles.cardFooter}>
                    <span className={styles.deckCount}>
                      <BookOpen size={13} />
                      {deckCount} {deckCount === 1 ? "deck" : "decks"}
                    </span>
                    <div className={styles.footerBtns}>
                      <button
                        className={styles.statsBtn}
                        onClick={() => navigate(`/dashboard/courses/${course.id}/progress`)}
                        title="View progress"
                      >
                        <BarChart2 size={14} />
                      </button>
                      <button
                        className={styles.studyBtn}
                        style={{ background: `${accent}20`, color: accent, borderColor: `${accent}40` }}
                        onClick={() => navigate(`/dashboard/courses/${course.id}`)}
                        disabled={deckCount === 0}
                      >
                        <Play size={13} fill="currentColor" />
                        Open
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Create / Edit modal ── */}
      <CourseFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditCourse(null); }}
        onSubmit={editCourse ? handleEdit : handleCreate}
        editCourse={editCourse}
      />

      {/* ── Delete confirm ── */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
            />
            <motion.div
              className={styles.deleteModal}
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ duration: 0.22 }}
            >
              <div className={styles.deleteIcon}>
                <Trash2 size={22} color="var(--error)" />
              </div>
              <h3 className={styles.deleteTitle}>Delete Course?</h3>
              <p className={styles.deleteSub}>
                "<strong>{deleteTarget?.title}</strong>" will be permanently deleted.
                Your decks inside won't be affected.
              </p>
              <div className={styles.deleteActions}>
                <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className={styles.deleteBtnConfirm} onClick={handleDelete} disabled={deleting}>
                  {deleting
                    ? <><Loader size={14} className={styles.spinner} /><span>Deleting...</span></>
                    : <><Trash2 size={14} /><span>Delete</span></>
                  }
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
