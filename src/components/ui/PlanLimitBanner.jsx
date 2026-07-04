import { useState } from "react";
import { AlertTriangle, Crown, X } from "lucide-react";
import UpgradeModal from "./UpgradeModal";
import styles from "./PlanLimitBanner.module.css";

export default function PlanLimitBanner({ message, show }) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [dismissed, setDismissed]     = useState(false);

  if (!show || dismissed) return null;

  return (
    <>
      <div className={styles.banner}>
        <AlertTriangle size={15} className={styles.icon} />
        <p className={styles.message}>{message}</p>
        <button
          className={styles.upgradeBtn}
          onClick={() => setUpgradeOpen(true)}
        >
          <Crown size={13} /> Upgrade
        </button>
        <button className={styles.dismissBtn} onClick={() => setDismissed(true)}>
          <X size={14} />
        </button>
      </div>

      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        reason={message}
      />
    </>
  );
}
