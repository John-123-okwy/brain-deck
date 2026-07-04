import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Loader, AlertCircle,
  Edit2, Trash2, Play, BookOpen, Layers, Sparkles,
} from "lucide-react";
import { getDeck } from "../../services/deckService";
import { getCards, addCard, updateCard, deleteCard } from "../../services/cardService";
import CardFormModal from "../../components/cards/CardFormModal";
import AICardGenerator from "../../components/cards/AICardGenerator";
import styles from "./DeckDetail.module.css";

const colorMap = {
  purple: "#a855f7", indigo: "#6366f1", pink: "#e879f9",
  blue:   "#3b82f6", green:  "#34d399", orange: "#fb923c",
};

export default function DeckDetail() {
  const { deckId } = useParams();
  const navigate   = useNavigate();

  const [deck, setDeck]               = useState(null);
  const [cards, setCards]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [modalOpen, setModalOpen]     = useState(false);
  const [aiOpen, setAiOpen]           = useState(false);
  const [editCard, setEditCard]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [deckData, cardsData] = await Promise.all([
        getDeck(deckId),
        getCards(deckId),
      ]);
      if (!deckData) { navigate("/dashboard/decks"); return; }
      setDeck(deckData);
      setCards(cardsData);
    } catch {
      setError("Failed to load deck. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [deckId, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleAddCard(formData) {
    await addCard(deckId, formData);
    await fetchAll();
  }

  async function handleEditCard(formData) {
    await updateCard(deckId, editCard.id, formData);
    await fetchAll();
    setEditCard(null);
  }

  // ── Save AI-generated cards (batch add) ──
  async function handleSaveAICards(generatedCards) {
    await Promise.all(generatedCards.map((card) => addCard(deckId, card)));
    await fetchAll();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteCard(deckId, deleteTarget.id);
      setCards((p) => p.filter((c) => c.id !== deleteTarget.id));
      setDeck((p) => ({ ...p, cardCount: Math.max(0, (p.cardCount ?? 1) - 1) }));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete card.");
    } finally {
      setDeleting(false);
    }
  }

  const accentColor = colorMap[deck?.color] ?? colorMap.purple;

  if (loading) return (
    <div className={styles.centerState}>
      <Loader size={32} className={styles.spinner} />
      <p>Loading deck...</p>
    </div>
  );

  if (error) return (
    <div className={styles.centerState}>
      <AlertCircle size={28} color="var(--error)" />
      <p style={{ color: "var(--error)" }}>{error}</p>
      <button className="btn-secondary" onClick={fetchAll}>Retry</button>
    </div>
  );

  return (
    <div className={styles.page}>

      {/* Back button */}
      <motion.button
        className={styles.backBtn}
        onClick={() => navigate("/dashboard/decks")}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ArrowLeft size={16} /> Back to Decks
      </motion.button>

      {/* Deck banner */}
      <motion.div
        className={styles.deckBanner}
        style={{ "--accent": accentColor }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.bannerStrip} />
        <div className={styles.bannerLeft}>
          <div className={styles.bannerIcon}>
            <BookOpen size={24} color="white" />
          </div>
          <div>
            <p className={styles.bannerSubject}>{deck.subject}</p>
            <h1 className={styles.bannerTitle}>{deck.title}</h1>
            {deck.description && (
              <p className={styles.bannerDesc}>{deck.description}</p>
            )}
          </div>
        </div>
        <div className={styles.bannerRight}>
          <div className={styles.statPill}>
            <Layers size={14} />
            <span>{cards.length} {cards.length === 1 ? "card" : "cards"}</span>
          </div>
          <button
            className={styles.studyNowBtn}
            style={{ background: `${accentColor}22`, color: accentColor, borderColor: `${accentColor}44` }}
            onClick={() => navigate(`/dashboard/decks/${deckId}/study`)}
            disabled={cards.length === 0}
          >
            <Play size={15} fill="currentColor" />
            Study Now
          </button>
        </div>
      </motion.div>

      {/* Section header */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Flashcards</h2>
        <div className={styles.sectionActions}>
          {/* AI Generate button */}
          <button
            className={styles.aiBtn}
            onClick={() => setAiOpen(true)}
          >
            <Sparkles size={15} />
            <span>AI Generate</span>
          </button>
          {/* Manual add button */}
          <button
            className="btn-primary"
            onClick={() => { setEditCard(null); setModalOpen(true); }}
          >
            <Plus size={16} />
            <span>Add Card</span>
          </button>
        </div>
      </div>

      {/* Cards list */}
      {cards.length === 0 ? (
        <motion.div
          className={styles.emptyState}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={styles.emptyOrb} />
          <Layers size={44} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No cards yet</h3>
          <p className={styles.emptySub}>
            Add cards manually or let AI generate them from your study material.
          </p>
          <div className={styles.emptyActions}>
            <button className={styles.aiBtn} onClick={() => setAiOpen(true)}>
              <Sparkles size={15} /><span>AI Generate</span>
            </button>
            <button className="btn-primary" onClick={() => setModalOpen(true)}>
              <Plus size={16} /><span>Add Manually</span>
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div className={styles.cardsList} layout>
          <AnimatePresence>
            {cards.map((card, i) => (
              <motion.div
                key={card.id}
                className={styles.cardItem}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                layout
              >
                <div
                  className={styles.cardNumber}
                  style={{ background: `${accentColor}18`, color: accentColor }}
                >
                  {i + 1}
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.cardSide}>
                    <span className={styles.sideLabel}>Front</span>
                    <p className={styles.sideText}>{card.front}</p>
                  </div>
                  <div className={styles.cardDivider} />
                  <div className={styles.cardSide}>
                    <span className={styles.sideLabel}>Back</span>
                    <p className={styles.sideText}>{card.back}</p>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => { setEditCard(card); setModalOpen(true); }}
                    aria-label="Edit card"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                    onClick={() => setDeleteTarget(card)}
                    aria-label="Delete card"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Manual card form modal */}
      <CardFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditCard(null); }}
        onSubmit={editCard ? handleEditCard : handleAddCard}
        editCard={editCard}
      />

      {/* AI Card Generator modal */}
      <AICardGenerator
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        onSaveCards={handleSaveAICards}
      />

      {/* Delete confirm */}
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
              <h3 className={styles.deleteTitle}>Delete Card?</h3>
              <p className={styles.deleteSub}>This flashcard will be permanently removed.</p>
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
