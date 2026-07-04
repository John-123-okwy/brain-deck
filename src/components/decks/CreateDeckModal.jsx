import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Loader } from "lucide-react";
import styles from "./CreateDeckModal.module.css";

const SUBJECTS = [
  "General", "Mathematics", "Science", "History", "Geography",
  "English", "Programming", "Biology", "Chemistry", "Physics",
  "Economics", "Languages", "Art", "Music", "Other",
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

export default function CreateDeckModal({ isOpen, onClose, onSubmit, editDeck = null }) {
  const [form, setForm] = useState(editDeck ?? EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync form when editDeck changes
  useState(() => { setForm(editDeck ?? EMPTY); }, [editDeck]);

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return setError("Deck title is required.");
    if (form.title.trim().length < 3) return setError("Title must be at least 3 characters.");

    try {
      setLoading(true);
      await onSubmit({ ...form, title: form.title.trim() });
      setForm(EMPTY);
      onClose();
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setForm(editDeck ?? EMPTY);
    setError("");
    onClose();
  }

  const isEdit = !!editDeck;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <div className={styles.modalIcon}>
                  <BookOpen size={18} color="white" />
                </div>
                <h2 className={styles.modalTitle}>
                  {isEdit ? "Edit Deck" : "Create New Deck"}
                </h2>
              </div>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.form}>

              {error && (
                <motion.div
                  className={styles.errorBox}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}

              {/* Title */}
              <div className={styles.field}>
                <label className={styles.label}>Deck Title <span className={styles.required}>*</span></label>
                <input
                  name="title"
                  type="text"
                  placeholder="e.g. Biology Chapter 3"
                  value={form.title}
                  onChange={handleChange}
                  className="input-base"
                  maxLength={60}
                  autoFocus
                />
                <span className={styles.charCount}>{form.title.length}/60</span>
              </div>

              {/* Description */}
              <div className={styles.field}>
                <label className={styles.label}>Description <span className={styles.optional}>(optional)</span></label>
                <textarea
                  name="description"
                  placeholder="What is this deck about?"
                  value={form.description}
                  onChange={handleChange}
                  className={`input-base ${styles.textarea}`}
                  maxLength={200}
                  rows={3}
                />
                <span className={styles.charCount}>{form.description.length}/200</span>
              </div>

              {/* Subject */}
              <div className={styles.field}>
                <label className={styles.label}>Subject</label>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className={`input-base ${styles.select}`}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Color picker */}
              <div className={styles.field}>
                <label className={styles.label}>Color Tag</label>
                <div className={styles.colorRow}>
                  {COLORS.map(({ name, hex }) => (
                    <button
                      key={name}
                      type="button"
                      className={`${styles.colorDot} ${form.color === name ? styles.colorDotActive : ""}`}
                      style={{ background: hex }}
                      onClick={() => setForm((p) => ({ ...p, color: name }))}
                      aria-label={name}
                      title={name}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                <button type="button" className="btn-secondary" onClick={handleClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader size={15} className={styles.spinner} />
                      <span>{isEdit ? "Saving..." : "Creating..."}</span>
                    </>
                  ) : (
                    <span>{isEdit ? "Save Changes" : "Create Deck"}</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
