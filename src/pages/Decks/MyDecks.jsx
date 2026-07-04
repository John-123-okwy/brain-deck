import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, BookOpen, Loader,
  AlertCircle, LayoutGrid, List, Trash2, X
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getUserDecks, createDeck, updateDeck, deleteDeck
} from "../../services/deckService";
import DeckCard from "../../components/decks/DeckCard";
import CreateDeckModal from "../../components/decks/CreateDeckModal";
import styles from "./MyDecks.module.css";

export default function MyDecks() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [decks, setDecks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [viewMode, setViewMode]     = useState("grid"); // grid | list
  const [modalOpen, setModalOpen]   = useState(false);
  const [editDeck, setEditDeck]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]     = useState(false);

  // ── Fetch decks ──
  const fetchDecks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getUserDecks(currentUser.uid);
      setDecks(data);
    } catch (err) {
      setError("Failed to load decks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchDecks(); }, [fetchDecks]);

  // ── Create ──
  async function handleCreate(formData) {
    await createDeck(currentUser.uid, formData);
    await fetchDecks();
  }

  // ── Edit ──
  async function handleEdit(formData) {
    await updateDeck(editDeck.id, formData);
    await fetchDecks();
    setEditDeck(null);
  }

  // ── Delete ──
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteDeck(deleteTarget.id);
      setDecks((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete deck.");
    } finally {
      setDeleting(false);
    }
  }

  // ── Study ──
  function handleStudy(deck) {
    navigate(`/dashboard/decks/${deck.id}/study`);
  }

  // ── Filtered decks ──
  const filtered = decks.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page}>

      {/* ── Page header ── */}
      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className={styles.pageTitle}>My Decks</h1>
          <p className={styles.pageSub}>
            {decks.length} {decks.length === 1 ? "deck" : "decks"} created
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => { setEditDeck(null); setModalOpen(true); }}
        >
          <Plus size={17} />
          <span>New Deck</span>
        </button>
      </motion.div>

      {/* ── Search + view toggle ── */}
      {decks.length > 0 && (
        <motion.div
          className={styles.toolbar}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search decks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`input-base ${styles.searchInput}`}
            />
            {search && (
              <button className={styles.clearSearch} onClick={() => setSearch("")}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === "grid" ? styles.viewBtnActive : ""}`}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid size={17} />
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === "list" ? styles.viewBtnActive : ""}`}
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <List size={17} />
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <div className={styles.loadingState}>
          <Loader size={32} className={styles.spinner} />
          <p>Loading your decks...</p>
        </div>
      ) : decks.length === 0 ? (
        /* ── Empty state ── */
        <motion.div
          className={styles.emptyState}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className={styles.emptyIllustration}>
            <div className={styles.emptyOrb} />
            <BookOpen size={52} className={styles.emptyIcon} />
          </div>
          <h2 className={styles.emptyTitle}>No decks yet</h2>
          <p className={styles.emptySub}>
            Create your first study deck to start learning and taking quizzes.
          </p>
          <button
            className="btn-primary"
            onClick={() => setModalOpen(true)}
          >
            <Plus size={17} />
            <span>Create First Deck</span>
          </button>
        </motion.div>
      ) : filtered.length === 0 ? (
        /* ── No search results ── */
        <div className={styles.noResults}>
          <Search size={32} className={styles.emptyIcon} />
          <p>No decks match "<strong>{search}</strong>"</p>
          <button className="btn-secondary" onClick={() => setSearch("")}>
            Clear search
          </button>
        </div>
      ) : (
        /* ── Deck grid / list ── */
        <motion.div
          className={viewMode === "grid" ? styles.grid : styles.listView}
          layout
        >
          <AnimatePresence>
            {filtered.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                onStudy={handleStudy}
                onEdit={(d) => { setEditDeck(d); setModalOpen(true); }}
                onDelete={(d) => setDeleteTarget(d)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Create / Edit modal ── */}
      <CreateDeckModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditDeck(null); }}
        onSubmit={editDeck ? handleEdit : handleCreate}
        editDeck={editDeck}
      />

      {/* ── Delete confirm modal ── */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                <Trash2 size={24} color="var(--error)" />
              </div>
              <h3 className={styles.deleteTitle}>Delete Deck?</h3>
              <p className={styles.deleteSub}>
                "<strong>{deleteTarget?.title}</strong>" will be permanently deleted
                along with all its cards. This cannot be undone.
              </p>
              <div className={styles.deleteActions}>
                <button
                  className="btn-secondary"
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </button>
                <button
                  className={styles.deleteBtnConfirm}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <><Loader size={15} className={styles.spinner} /><span>Deleting...</span></>
                  ) : (
                    <><Trash2 size={15} /><span>Delete</span></>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
