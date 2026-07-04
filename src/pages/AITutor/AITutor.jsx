import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Send, Loader, Sparkles,
  RefreshCw, BookOpen, ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCredits } from "../../hooks/useCredits";
import { getUserDecks } from "../../services/deckService";
import UpgradeModal from "../../components/ui/UpgradeModal";
import styles from "./AITutor.module.css";

// ── Suggested starter questions ──
const SUGGESTIONS = [
  "Explain a concept I'm struggling with",
  "Quiz me on what I've been studying",
  "Give me a study plan for my decks",
  "What's the best way to memorize flashcards?",
  "Summarize the key points from my deck",
];

// ── Call Claude API ──
async function callClaude(messages, systemPrompt) {
  const response = await fetch("/api/anthropic/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system:     systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
}

export default function AITutor() {
  const { currentUser, userProfile } = useAuth();
  const { credits, isPro, spendCredit, upgradeOpen, setUpgradeOpen } = useCredits();

  const [decks, setDecks]           = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [messages, setMessages]     = useState([]); // { role, content, id }
  const [input, setInput]           = useState("");
  const [typing, setTyping]         = useState(false);
  const [error, setError]           = useState("");
  const [msgCount, setMsgCount]     = useState(0); // messages since last credit spend
  const [showDeckPicker, setShowDeckPicker] = useState(false);

  const bottomRef    = useRef(null);
  const inputRef     = useRef(null);
  const deckPickerRef = useRef(null);

  // ── Fetch user decks ──
  useEffect(() => {
    if (!currentUser) return;
    getUserDecks(currentUser.uid)
      .then(setDecks)
      .catch(() => {});
  }, [currentUser]);

  // ── Auto scroll to bottom on new message ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // ── Close deck picker on outside click ──
  useEffect(() => {
    function handleClick(e) {
      if (deckPickerRef.current && !deckPickerRef.current.contains(e.target)) {
        setShowDeckPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Build system prompt ──
  function buildSystemPrompt() {
    const username = userProfile?.username ?? "there";
    const deckInfo = selectedDeck
      ? `The student is currently studying a deck called "${selectedDeck.title}" (subject: ${selectedDeck.subject}).`
      : decks.length > 0
        ? `The student has these study decks: ${decks.map((d) => `"${d.title}" (${d.subject})`).join(", ")}.`
        : "The student hasn't created any decks yet.";

    return `You are BrainDeck AI Tutor — a friendly, knowledgeable study assistant.

Student name: ${username}
${deckInfo}

Your role:
- Help the student understand and memorize their study material
- Answer questions clearly and concisely
- Use examples, analogies, and mnemonics where helpful
- Encourage and motivate the student
- If asked to quiz them, create questions based on their deck topics
- Keep responses focused and not too long — this is a chat, not an essay
- Be warm, supportive and engaging`;
  }

  // ── Send message ──
  async function handleSend(text) {
    const content = (text || input).trim();
    if (!content || typing) return;

    setInput("");
    setError("");

    // Check if we need to spend a credit (every 5 messages)
    const newMsgCount = msgCount + 1;
    if (newMsgCount % 5 === 1 && newMsgCount > 0) {
      // Spend 1 credit every 5 messages
      const allowed = await spendCredit("ai_tutor");
      if (!allowed) return;
    }
    setMsgCount(newMsgCount);

    // Add user message
    const userMsg = { role: "user", content, id: Date.now() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    // Build API messages array (no system field — that goes separately)
    const apiMessages = updatedMessages.map(({ role, content }) => ({ role, content }));

    try {
      setTyping(true);
      const reply = await callClaude(apiMessages, buildSystemPrompt());

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, id: Date.now() + 1 },
      ]);
    } catch (err) {
      console.error("Tutor error:", err);
      setError("Failed to get a response. Please try again.");
    } finally {
      setTyping(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function clearChat() {
    setMessages([]);
    setMsgCount(0);
    setError("");
    inputRef.current?.focus();
  }

  // Credits left display
  const creditsLabel = isPro
    ? "Pro — unlimited"
    : `${credits} credit${credits !== 1 ? "s" : ""} left`;

  const messagesUntilNextCredit = isPro
    ? null
    : 5 - ((msgCount) % 5);

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Brain size={22} color="white" />
          </div>
          <div>
            <h1 className={styles.pageTitle}>AI Tutor</h1>
            <p className={styles.pageSub}>Your personal study assistant</p>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Deck context picker */}
          <div className={styles.deckPickerWrap} ref={deckPickerRef}>
            <button
              className={styles.deckPickerBtn}
              onClick={() => setShowDeckPicker((p) => !p)}
            >
              <BookOpen size={14} />
              <span>{selectedDeck ? selectedDeck.title : "All decks"}</span>
              <ChevronDown size={13} />
            </button>

            <AnimatePresence>
              {showDeckPicker && (
                <motion.div
                  className={styles.deckDropdown}
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                >
                  <button
                    className={`${styles.deckDropdownItem} ${!selectedDeck ? styles.deckDropdownItemActive : ""}`}
                    onClick={() => { setSelectedDeck(null); setShowDeckPicker(false); }}
                  >
                    All decks
                  </button>
                  {decks.map((deck) => (
                    <button
                      key={deck.id}
                      className={`${styles.deckDropdownItem} ${selectedDeck?.id === deck.id ? styles.deckDropdownItemActive : ""}`}
                      onClick={() => { setSelectedDeck(deck); setShowDeckPicker(false); }}
                    >
                      {deck.title}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Credit info */}
          <div className={`${styles.creditInfo} ${credits === 0 && !isPro ? styles.creditInfoEmpty : ""}`}>
            <Sparkles size={13} />
            <span>{creditsLabel}</span>
          </div>

          {/* Clear chat */}
          {messages.length > 0 && (
            <button className={styles.clearBtn} onClick={clearChat} title="Clear chat">
              <RefreshCw size={15} />
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Chat area ── */}
      <div className={styles.chatContainer}>

        {/* Empty state / suggestions */}
        {messages.length === 0 && (
          <motion.div
            className={styles.emptyState}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className={styles.emptyIcon}>
              <Brain size={44} style={{ color: "var(--purple-light)", opacity: 0.6 }} />
            </div>
            <h2 className={styles.emptyTitle}>
              Hi {userProfile?.username?.split(" ")[0] ?? "there"} 👋
            </h2>
            <p className={styles.emptySub}>
              Ask me anything about your studies. I can explain concepts,
              quiz you, or help you build a study plan.
            </p>

            {/* Suggestion chips */}
            <div className={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <motion.button
                  key={s}
                  className={styles.suggestion}
                  onClick={() => handleSend(s)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Messages */}
        <div className={styles.messages}>
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                className={`${styles.messageRow} ${msg.role === "user" ? styles.messageRowUser : styles.messageRowAssistant}`}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {/* Avatar */}
                {msg.role === "assistant" && (
                  <div className={styles.assistantAvatar}>
                    <Brain size={16} />
                  </div>
                )}

                {/* Bubble */}
                <div className={`${styles.bubble} ${msg.role === "user" ? styles.bubbleUser : styles.bubbleAssistant}`}>
                  <p className={styles.bubbleText}>{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {typing && (
              <motion.div
                className={`${styles.messageRow} ${styles.messageRowAssistant}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className={styles.assistantAvatar}>
                  <Brain size={16} />
                </div>
                <div className={`${styles.bubble} ${styles.bubbleAssistant} ${styles.typingBubble}`}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className={styles.errorBox}>
          {error}
          <button className={styles.errorDismiss} onClick={() => setError("")}>✕</button>
        </div>
      )}

      {/* ── Credit warning ── */}
      {!isPro && credits <= 1 && credits > 0 && (
        <div className={styles.creditWarning}>
          <Sparkles size={13} />
          {credits === 1
            ? "Last credit remaining — upgrade to Pro for unlimited access"
            : `${messagesUntilNextCredit} message${messagesUntilNextCredit !== 1 ? "s" : ""} before next credit is used`}
        </div>
      )}

      {/* ── Input area ── */}
      <div className={styles.inputArea}>
        <div className={styles.inputRow}>
          <textarea
            ref={inputRef}
            className={styles.input}
            placeholder={
              credits === 0 && !isPro
                ? "No credits remaining — upgrade to continue chatting"
                : "Ask me anything about your studies..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={typing || (credits === 0 && !isPro)}
          />
          <motion.button
            className={`${styles.sendBtn} ${(!input.trim() || typing || (credits === 0 && !isPro)) ? styles.sendBtnDisabled : ""}`}
            onClick={() => handleSend()}
            disabled={!input.trim() || typing || (credits === 0 && !isPro)}
            whileHover={input.trim() ? { scale: 1.05 } : {}}
            whileTap={input.trim() ? { scale: 0.95 } : {}}
          >
            {typing
              ? <Loader size={18} className={styles.spinner} />
              : <Send size={18} />
            }
          </motion.button>
        </div>
        <p className={styles.inputHint}>
          Press Enter to send · Shift+Enter for new line
          {!isPro && <span> · 1 credit per 5 messages</span>}
        </p>
      </div>

      {/* Upgrade modal */}
      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        reason="You've used all your AI credits. Upgrade to Pro for unlimited AI Tutor access."
      />
    </div>
  );
}
