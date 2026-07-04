import { motion } from "framer-motion";
import { BookOpen, MoreVertical, Trash2, Edit2, Play } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import styles from "./DeckCard.module.css";

const colorMap = {
  purple: { bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.25)", icon: "#a855f7" },
  indigo: { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)", icon: "#6366f1" },
  pink:   { bg: "rgba(232,121,249,0.12)",border: "rgba(232,121,249,0.25)",icon: "#e879f9" },
  blue:   { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)", icon: "#3b82f6" },
  green:  { bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.25)", icon: "#34d399" },
  orange: { bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.25)", icon: "#fb923c" },
};

export default function DeckCard({ deck, onStudy, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const colors = colorMap[deck.color] ?? colorMap.purple;

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <motion.div
      className={styles.card}
      style={{ "--card-border": colors.border }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
    >
      {/* Color strip top */}
      <div
        className={styles.strip}
        style={{ background: `linear-gradient(90deg, ${colors.icon}, transparent)` }}
      />

      {/* Header row */}
      <div className={styles.header}>
        <div className={styles.iconBox} style={{ background: colors.bg }}>
          <BookOpen size={20} style={{ color: colors.icon }} />
        </div>

        {/* 3-dot menu */}
        <div className={styles.menuWrapper} ref={menuRef}>
          <button
            className={styles.menuBtn}
            onClick={() => setMenuOpen((p) => !p)}
            aria-label="Deck options"
          >
            <MoreVertical size={17} />
          </button>

          {menuOpen && (
            <motion.div
              className={styles.menu}
              initial={{ opacity: 0, scale: 0.92, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <button
                className={styles.menuItem}
                onClick={() => { onEdit(deck); setMenuOpen(false); }}
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                className={`${styles.menuItem} ${styles.menuItemDelete}`}
                onClick={() => { onDelete(deck); setMenuOpen(false); }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <span className={styles.subject}>{deck.subject}</span>
        <h3 className={styles.title}>{deck.title}</h3>
        {deck.description && (
          <p className={styles.description}>{deck.description}</p>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span className={styles.cardCount}>
          <BookOpen size={13} />
          {deck.cardCount ?? 0} {deck.cardCount === 1 ? "card" : "cards"}
        </span>
        <button
          className={styles.studyBtn}
          style={{ background: colors.bg, color: colors.icon, borderColor: colors.border }}
          onClick={() => onStudy(deck)}
        >
          <Play size={13} fill="currentColor" />
          Study
        </button>
      </div>
    </motion.div>
  );
}
