import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Sparkles, Upload, FileText, Image,
  Loader, AlertCircle, Plus, Brain, Check,
} from "lucide-react";
import { useCredits } from "../../hooks/useCredits";
import UpgradeModal from "../ui/UpgradeModal";
import styles from "./AICardGenerator.module.css";

const MAX_FILE_MB = 10;

async function generateCardsFromContent(content, contentType) {
  const systemPrompt = `You are a flashcard generation expert. Given study material, extract the most important concepts and generate clear, concise flashcards.

Rules:
- Generate between 5 and 20 flashcards depending on content richness
- Front: a clear question, term, or concept (max 120 chars)
- Back: a concise answer or definition (max 250 chars)
- Focus on key facts, definitions, formulas, and important concepts
- Return ONLY valid JSON with no markdown, no explanation, nothing else

Output format exactly:
{"cards": [{"front": "...", "back": "..."}, ...]}`;

  let messages;

  if (contentType === "text") {
    messages = [
      {
        role: "user",
        content: `Generate flashcards from this study material:\n\n${content}`,
      },
    ];
  } else if (contentType === "pdf") {
    messages = [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: content.base64,
            },
          },
          { type: "text", text: "Generate flashcards from the content in this PDF." },
        ],
      },
    ];
  } else {
    messages = [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: content.mediaType,
              data: content.base64,
            },
          },
          { type: "text", text: "Generate flashcards from the content in this image." },
        ],
      },
    ];
  }

  const response = await fetch("/api/anthropic/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("API error:", response.status, errText);
    throw new Error(`API error ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const clean = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(clean);
  return Array.isArray(parsed.cards) ? parsed.cards : [];
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

export default function AICardGenerator({ isOpen, onClose, onSaveCards }) {
  const { spendCredit, upgradeOpen, setUpgradeOpen } = useCredits();

  const [step, setStep]             = useState("upload");
  const [inputMode, setInputMode]   = useState("text");
  const [file, setFile]             = useState(null);
  const [textInput, setTextInput]   = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState("");
  const [generatedCards, setGeneratedCards] = useState([]);
  const [selectedCards, setSelectedCards]   = useState({});
  const [saving, setSaving]         = useState(false);
  const [dragOver, setDragOver]     = useState(false);
  const fileInputRef = useRef(null);

  function handleClose() {
    setStep("upload");
    setInputMode("text");
    setFile(null);
    setTextInput("");
    setGeneratedCards([]);
    setSelectedCards({});
    setError("");
    onClose();
  }

  function handleFileSelect(selected) {
    setError("");
    if (!selected) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(selected.type)) {
      setError("Only PDF, JPG, PNG, or WEBP files are supported.");
      return;
    }
    if (selected.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_FILE_MB}MB.`);
      return;
    }
    setFile(selected);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  }

  async function handleGenerate() {
    setError("");

    if (inputMode === "text" && !textInput.trim()) {
      setError("Please paste some study material first.");
      return;
    }
    if (inputMode === "file" && !file) {
      setError("Please select a file first.");
      return;
    }

    // ── Spend credit BEFORE calling API ──
    const allowed = await spendCredit("ai_generation");
    if (!allowed) return; // upgrade modal shown by useCredits

    try {
      setGenerating(true);
      let cards = [];

      if (inputMode === "text") {
        cards = await generateCardsFromContent(textInput.trim(), "text");
      } else {
        const base64    = await fileToBase64(file);
        const mediaType = file.type;
        const isPdf     = file.type === "application/pdf";
        cards = await generateCardsFromContent(
          { base64, mediaType },
          isPdf ? "pdf" : "image"
        );
      }

      if (!cards.length) {
        setError("No cards could be generated. Try different content.");
        return;
      }

      setGeneratedCards(cards);
      const allSelected = {};
      cards.forEach((_, i) => { allSelected[i] = true; });
      setSelectedCards(allSelected);
      setStep("preview");
    } catch (err) {
      console.error("Generation error:", err);
      setError("Failed to generate cards. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function toggleCard(index) {
    setSelectedCards((p) => ({ ...p, [index]: !p[index] }));
  }

  function selectAll() {
    const s = {};
    generatedCards.forEach((_, i) => { s[i] = true; });
    setSelectedCards(s);
  }

  function deselectAll() { setSelectedCards({}); }

  async function handleSave() {
    const toSave = generatedCards.filter((_, i) => selectedCards[i]);
    if (!toSave.length) { setError("Select at least one card to save."); return; }
    try {
      setSaving(true);
      await onSaveCards(toSave);
      handleClose();
    } catch {
      setError("Failed to save cards. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const selectedCount = Object.values(selectedCards).filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <>
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
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              {/* Header */}
              <div className={styles.header}>
                <div className={styles.headerLeft}>
                  <div className={styles.headerIcon}>
                    <Sparkles size={18} color="white" />
                  </div>
                  <div>
                    <h2 className={styles.title}>AI Card Generator</h2>
                    <p className={styles.subtitle}>
                      {step === "upload"
                        ? "Upload material and let AI create flashcards"
                        : `${generatedCards.length} cards generated — select which to save`}
                    </p>
                  </div>
                </div>
                <button className={styles.closeBtn} onClick={handleClose}>
                  <X size={17} />
                </button>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  className={styles.errorBox}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle size={15} /> {error}
                </motion.div>
              )}

              {/* ── UPLOAD STEP ── */}
              {step === "upload" && (
                <div className={styles.uploadStep}>

                  {/* Mode toggle */}
                  <div className={styles.modeToggle}>
                    <button
                      className={`${styles.modeBtn} ${inputMode === "text" ? styles.modeBtnActive : ""}`}
                      onClick={() => { setInputMode("text"); setError(""); }}
                    >
                      <FileText size={15} /> Paste Text
                    </button>
                    <button
                      className={`${styles.modeBtn} ${inputMode === "file" ? styles.modeBtnActive : ""}`}
                      onClick={() => { setInputMode("file"); setError(""); }}
                    >
                      <Upload size={15} /> File Upload
                    </button>
                  </div>

                  {/* Text input */}
                  {inputMode === "text" && (
                    <div className={styles.textInputWrap}>
                      <textarea
                        className={`input-base ${styles.textArea}`}
                        placeholder="Paste your notes, textbook content, definitions, or any study material here..."
                        value={textInput}
                        onChange={(e) => { setTextInput(e.target.value); setError(""); }}
                        rows={9}
                        autoFocus
                      />
                      <div className={styles.textInputMeta}>
                        <span>{textInput.length} characters</span>
                        {textInput.length > 0 && (
                          <button className={styles.clearTextBtn} onClick={() => setTextInput("")}>
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* File upload */}
                  {inputMode === "file" && (
                    <div
                      className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ""} ${file ? styles.dropzoneHasFile : ""}`}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        style={{ display: "none" }}
                        onChange={(e) => handleFileSelect(e.target.files[0])}
                      />
                      {file ? (
                        <div className={styles.filePreview}>
                          {file.type === "application/pdf"
                            ? <FileText size={32} className={styles.fileIcon} />
                            : <Image size={32} className={styles.fileIcon} />
                          }
                          <div className={styles.fileInfo}>
                            <p className={styles.fileName}>{file.name}</p>
                            <p className={styles.fileSize}>
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            className={styles.removeFileBtn}
                            onClick={(e) => { e.stopPropagation(); setFile(null); setError(""); }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className={styles.dropzoneEmpty}>
                          <div className={styles.dropzoneIconWrap}>
                            <Upload size={28} className={styles.dropzoneIcon} />
                          </div>
                          <p className={styles.dropzoneTitle}>
                            Drop your file here or click to browse
                          </p>
                          <p className={styles.dropzoneSub}>
                            PDF, JPG, PNG, WEBP · Max {MAX_FILE_MB}MB
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tips */}
                  <div className={styles.tips}>
                    <Brain size={14} className={styles.tipsIcon} />
                    <p className={styles.tipsText}>
                      <strong>Tips:</strong> Works best with notes, textbook pages, or definitions.
                      The more specific the content, the better the cards.
                    </p>
                  </div>

                  {/* Generate button */}
                  <button
                    className={`btn-primary ${styles.generateBtn}`}
                    onClick={handleGenerate}
                    disabled={generating || (inputMode === "text" ? !textInput.trim() : !file)}
                  >
                    {generating ? (
                      <><Loader size={16} className={styles.spinner} /><span>Generating cards...</span></>
                    ) : (
                      <><Sparkles size={16} /><span>Generate Flashcards</span></>
                    )}
                  </button>
                </div>
              )}

              {/* ── PREVIEW STEP ── */}
              {step === "preview" && (
                <div className={styles.previewStep}>
                  <div className={styles.previewToolbar}>
                    <span className={styles.previewCount}>
                      <Check size={14} /> {selectedCount} of {generatedCards.length} selected
                    </span>
                    <div className={styles.previewToolbarBtns}>
                      <button className={styles.toolbarBtn} onClick={selectAll}>Select all</button>
                      <button className={styles.toolbarBtn} onClick={deselectAll}>Deselect all</button>
                      <button className={styles.toolbarBtnBack} onClick={() => setStep("upload")}>
                        ← Try again
                      </button>
                    </div>
                  </div>

                  <div className={styles.cardsList}>
                    {generatedCards.map((card, i) => {
                      const isSelected = !!selectedCards[i];
                      return (
                        <motion.div
                          key={i}
                          className={`${styles.previewCard} ${isSelected ? styles.previewCardSelected : ""}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => toggleCard(i)}
                        >
                          <div className={`${styles.cardCheckbox} ${isSelected ? styles.cardCheckboxActive : ""}`}>
                            {isSelected && <Check size={11} color="white" />}
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
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className={styles.previewActions}>
                    <button className="btn-secondary" onClick={handleClose}>Cancel</button>
                    <button
                      className={`btn-primary ${styles.saveBtn}`}
                      onClick={handleSave}
                      disabled={saving || selectedCount === 0}
                    >
                      {saving
                        ? <><Loader size={15} className={styles.spinner} /><span>Saving...</span></>
                        : <><Plus size={15} /><span>Save {selectedCount} Card{selectedCount !== 1 ? "s" : ""}</span></>
                      }
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Upgrade modal — shown when credits run out */}
      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        reason="You've used all your AI credits. Upgrade to Pro for 50 credits/month."
      />
    </>
  );
}
