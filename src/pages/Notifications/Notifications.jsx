import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CheckCheck, Loader, ClipboardList,
  Flame, Sparkles, Info, Trophy, Check,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getNotifications, markAsRead, markAllAsRead,
} from "../../services/notificationService";
import styles from "./Notifications.module.css";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" },
});

// Icon map per notification type
function NotifIcon({ type }) {
  const props = { size: 18 };
  switch (type) {
    case "quiz_result":  return <ClipboardList {...props} />;
    case "streak":       return <Flame         {...props} />;
    case "achievement":  return <Trophy        {...props} />;
    case "info":         return <Sparkles      {...props} />;
    default:             return <Bell          {...props} />;
  }
}

function iconColor(type) {
  switch (type) {
    case "quiz_result":  return "var(--indigo-accent)";
    case "streak":       return "#fb923c";
    case "achievement":  return "#fbbf24";
    case "info":         return "var(--purple-light)";
    default:             return "var(--text-muted)";
  }
}

function iconBg(type) {
  switch (type) {
    case "quiz_result":  return "rgba(99,102,241,0.15)";
    case "streak":       return "rgba(251,146,60,0.15)";
    case "achievement":  return "rgba(251,191,36,0.15)";
    case "info":         return "rgba(168,85,247,0.15)";
    default:             return "var(--bg-secondary)";
  }
}

function formatDate(ts) {
  if (!ts) return "";
  try {
    const d   = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60)   return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch { return ""; }
}

export default function Notifications() {
  const { currentUser } = useAuth();
  const navigate        = useNavigate();

  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [marking, setMarking] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getNotifications(currentUser.uid);
      setNotifs(data);
    } catch {
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  async function handleMarkOne(notif) {
    if (notif.read) {
      if (notif.link) navigate(notif.link);
      return;
    }
    await markAsRead(notif.id);
    setNotifs((prev) =>
      prev.map((n) => n.id === notif.id ? { ...n, read: true } : n)
    );
    if (notif.link) navigate(notif.link);
  }

  async function handleMarkAll() {
    if (!unreadCount) return;
    try {
      setMarking(true);
      await markAllAsRead(currentUser.uid);
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      setError("Failed to mark all as read.");
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className={styles.page}>

      {/* ── Page header ── */}
      <motion.div className={styles.pageHeader} {...fadeUp(0)}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Bell size={22} color="white" />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Notifications</h1>
            <p className={styles.pageSub}>
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                : "All caught up!"}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            className={styles.markAllBtn}
            onClick={handleMarkAll}
            disabled={marking}
          >
            {marking
              ? <Loader size={14} className={styles.spinner} />
              : <CheckCheck size={14} />
            }
            <span>Mark all as read</span>
          </button>
        )}
      </motion.div>

      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {loading ? (
        <div className={styles.centerState}>
          <Loader size={28} className={styles.spinner} />
          <p>Loading notifications...</p>
        </div>
      ) : notifs.length === 0 ? (
        /* Empty state */
        <motion.div
          className={styles.emptyState}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={styles.emptyOrb} />
          <div className={styles.emptyIconWrap}>
            <Bell size={44} className={styles.emptyIcon} />
          </div>
          <h3 className={styles.emptyTitle}>No notifications yet</h3>
          <p className={styles.emptySub}>
            Take a quiz or complete a study session to start receiving notifications here.
          </p>
        </motion.div>
      ) : (
        <motion.div
          className={styles.notifList}
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
        >
          <AnimatePresence>
            {notifs.map((notif) => (
              <motion.div
                key={notif.id}
                className={`${styles.notifItem} ${!notif.read ? styles.notifItemUnread : ""}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={() => handleMarkOne(notif)}
                whileHover={{ scale: 1.005 }}
                transition={{ duration: 0.2 }}
              >
                {/* Unread dot */}
                {!notif.read && <div className={styles.unreadDot} />}

                {/* Icon */}
                <div
                  className={styles.notifIcon}
                  style={{
                    background: iconBg(notif.type),
                    color:      iconColor(notif.type),
                  }}
                >
                  <NotifIcon type={notif.type} />
                </div>

                {/* Content */}
                <div className={styles.notifContent}>
                  <p className={styles.notifTitle}>{notif.title}</p>
                  <p className={styles.notifMessage}>{notif.message}</p>
                  <p className={styles.notifTime}>{formatDate(notif.createdAt)}</p>
                </div>

                {/* Read indicator */}
                {notif.read && (
                  <div className={styles.readCheck}>
                    <Check size={13} />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
