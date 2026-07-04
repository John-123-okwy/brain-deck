import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Check, Zap, Crown } from "lucide-react";
import { PLANS } from "../../config/PlanConfig";
import styles from "./UpgradeModal.module.css";

const FREE_FEATURES = [
  "Up to 5 decks",
  "Up to 30 cards per deck",
  "Up to 3 courses",
  "5 AI credits (one-time)",
  "Basic quiz (max 20 questions)",
];

const PRO_FEATURES = [
  "Unlimited decks & cards",
  "Unlimited courses",
  "50 AI credits per month",
  "AI Tutor chat",
  "Unlimited quiz questions",
  "Full progress analytics",
  "Priority support",
];

export default function UpgradeModal({ isOpen, onClose, reason = "" }) {
  function handleUpgrade() {
    // Stripe will be integrated here in a future phase
    // For now, show a coming soon message
    alert("Payment integration coming soon! For now, contact support to upgrade manually.");
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
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
              <button className={styles.closeBtn} onClick={onClose}>
                <X size={17} />
              </button>
            </div>

            {/* Crown icon */}
            <motion.div
              className={styles.crownWrap}
              initial={{ scale: 0.5, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
            >
              <Crown size={36} color="#fbbf24" />
            </motion.div>

            <h2 className={styles.title}>Upgrade to Pro</h2>

            {/* Reason message */}
            {reason && (
              <div className={styles.reasonBox}>
                <Zap size={14} />
                <span>{reason}</span>
              </div>
            )}

            {/* Plans comparison */}
            <div className={styles.plansRow}>

              {/* Free plan */}
              <div className={styles.planCard}>
                <div className={styles.planHeader}>
                  <p className={styles.planName}>Free</p>
                  <p className={styles.planPrice}>$0<span>/mo</span></p>
                </div>
                <ul className={styles.featureList}>
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className={styles.featureItem}>
                      <Check size={13} className={styles.featureIconFree} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pro plan */}
              <div className={`${styles.planCard} ${styles.planCardPro}`}>
                <div className={styles.proBadge}>
                  <Sparkles size={12} /> Most Popular
                </div>
                <div className={styles.planHeader}>
                  <p className={styles.planName} style={{ color: "var(--purple-light)" }}>Pro</p>
                  <p className={styles.planPrice}>
                    $6<span>/mo</span>
                  </p>
                </div>
                <ul className={styles.featureList}>
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className={styles.featureItem}>
                      <Check size={13} className={styles.featureIconPro} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* CTA */}
            <motion.button
              className={styles.upgradeBtn}
              onClick={handleUpgrade}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Crown size={16} />
              <span>Upgrade to Pro — $6/mo</span>
            </motion.button>

            <p className={styles.cancelNote}>
              Cancel anytime · No hidden fees
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
