import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GraduationCap, Loader } from "lucide-react";
import styles from "./CourseFormModal.module.css";

const SUBJECTS = [
  "General","Mathematics","Science","History","Geography",
  "English","Programming","Biology","Chemistry","Physics",
  "Economics","Languages","Art","Music","Other",
];

const COLORS = [
  { name: "purple", hex: "#a855f7" },
  { name: "indigo", hex: "#6366f1" },
  { name: "pink",   hex: "#e879f9" },
  { name: "blue",   hex: "#3b82f6" },
  { name: "green",  hex: "#34d399" },
  { name: "orange", hex: "#fb923c" },
];

const EMPTY = { title: "", description: "", subject: "General", color: "purple" };

export default function CourseFormModal({ isOpen, onClose, onSubmit, editCourse = null }) {
  const [form, setForm]       = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    setForm(editCourse
      ? { title: editCourse.title, description: editCourse.description, subject: editCourse.subject, color: editCourse.color }
      : EMPTY
    );
    setError("");
  }, [editCourse, isOpen]);

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim())          return setError("Course title is required.");
    if (form.title.trim().length < 3) return setError("Title must be at least 3 characters.");
    try {
      setLoading(true);
      await onSubmit({ ...form, title: form.title.trim() });
      setForm(EMPTY);
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setForm(editCourse ? { title: editCourse.title, description: editCourse.description, subject: editCourse.subject, color: editCourse.color } : EMPTY);
    setError("");
    onClose();
  }

  const isEdit = !!editCourse;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.titleRow}>
                <div className={styles.icon}>
                  <GraduationCap size={18} color="white" />
                </div>
                <h2 className={styles.title}>
                  {isEdit ? "Edit Course" : "Create New Course"}
                </h2>
              </div>
              <button className={styles.closeBtn} onClick={handleClose}>
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {error && (
                <motion.div className={styles.errorBox} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                  {error}
                </motion.div>
              )}

              {/* Title */}
              <div className={styles.field}>
                <label className={styles.label}>Course Title <span className={styles.req}>*</span></label>
                <input
                  name="title" type="text"
                  placeholder="e.g. Biology 101"
                  value={form.title} onChange={handleChange}
                  className="input-base" maxLength={60} autoFocus
                />
                <span className={styles.charCount}>{form.title.length}/60</span>
              </div>

              {/* Description */}
              <div className={styles.field}>
                <label className={styles.label}>Description <span className={styles.opt}>(optional)</span></label>
                <textarea
                  name="description"
                  placeholder="What is this course about?"
                  value={form.description} onChange={handleChange}
                  className={`input-base ${styles.textarea}`}
                  maxLength={200} rows={3}
                />
                <span className={styles.charCount}>{form.description.length}/200</span>
              </div>

              {/* Subject */}
              <div className={styles.field}>
                <label className={styles.label}>Subject</label>
                <select name="subject" value={form.subject} onChange={handleChange} className={`input-base ${styles.select}`}>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Color */}
              <div className={styles.field}>
                <label className={styles.label}>Color Tag</label>
                <div className={styles.colorRow}>
                  {COLORS.map(({ name, hex }) => (
                    <button
                      key={name} type="button"
                      className={`${styles.colorDot} ${form.color === name ? styles.colorDotActive : ""}`}
                      style={{ background: hex }}
                      onClick={() => setForm((p) => ({ ...p, color: name }))}
                      aria-label={name}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.actions}>
                <button type="button" className="btn-secondary" onClick={handleClose}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading
                    ? <><Loader size={15} className={styles.spinner} /><span>{isEdit ? "Saving..." : "Creating..."}</span></>
                    : <span>{isEdit ? "Save Changes" : "Create Course"}</span>
                  }
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
