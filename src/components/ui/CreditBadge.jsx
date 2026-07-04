import { Sparkles, Crown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import styles from "./CreditBadge.module.css";

export default function CreditBadge({ onClick }) {
  const { userProfile, isPro } = useAuth();
  const credits = userProfile?.aiCredits ?? 0;
  const pro     = isPro();

  return (
    <button
      className={`${styles.badge} ${pro ? styles.badgePro : ""} ${credits === 0 && !pro ? styles.badgeEmpty : ""}`}
      onClick={onClick}
      title={pro ? "Pro Plan" : `${credits} AI credits remaining`}
    >
      {pro ? (
        <>
          <Crown size={13} className={styles.icon} />
          <span>Pro</span>
        </>
      ) : (
        <>
          <Sparkles size={13} className={styles.icon} />
          <span>{credits} credit{credits !== 1 ? "s" : ""}</span>
        </>
      )}
    </button>
  );
}
