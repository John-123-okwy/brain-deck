import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Layers, Loader } from "lucide-react";
import styles from "./CardFormModal.module.css";

const EMPTY = { front: "", back: "" };

export default function CardFormModal({ isOpen, onClose, onSubmit, editCard = null }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(editCard ? { front: editCard.front, back: editCard.back } : EMPTY);
    setError("");
  }, [editCard, isOpen]);

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.front.trim()) return setError("Front side is required.");
    if (!form.back.trim()) return setError("Back side is required.");
    try {
      setLoading(true);
      await onSubmit({ front: form.front.trim(), back: form.back.trim() });
      setForm(EMPTY);
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setForm(EMPTY);
    setError("");
    onClose();
  }

  const isEdit = !!editCard;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                  <Layers size={17} color="white" />
                </div>
                <h2 className={styles.title}>
                  {isEdit ? "Edit Card" : "Add New Card"}
                </h2>
              </div>
              <button className={styles.closeBtn} onClick={handleClose}>
                <X size={17} />
              </button>
            </div>

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

              {/* Front */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Front <span className={styles.hint}>(question / term)</span>
                </label>
                <textarea
                  name="front"
                  placeholder="e.g. What is photosynthesis?"
                  value={form.front}
                  onChange={handleChange}
                  className={`input-base ${styles.textarea}`}
                  rows={3}
                  maxLength={300}
                  autoFocus
                />
                <span className={styles.charCount}>{form.front.length}/300</span>
              </div>

              {/* Back */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Back <span className={styles.hint}>(answer / definition)</span>
                </label>
                <textarea
                  name="back"
                  placeholder="e.g. The process by which plants use sunlight..."
                  value={form.back}
                  onChange={handleChange}
                  className={`input-base ${styles.textarea}`}
                  rows={3}
                  maxLength={300}
                />
                <span className={styles.charCount}>{form.back.length}/300</span>
              </div>

              <div className={styles.actions}>
                <button type="button" className="btn-secondary" onClick={handleClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <><Loader size={15} className={styles.spinner} /><span>{isEdit ? "Saving..." : "Adding..."}</span></>
                  ) : (
                    <span>{isEdit ? "Save Card" : "Add Card"}</span>
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
