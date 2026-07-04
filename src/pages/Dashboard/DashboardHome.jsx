import { motion } from "framer-motion";
import {
  BookOpen,
  ClipboardList,
  Flame,
  Star,
  TrendingUp,
  Plus,
  ArrowRight,
  Brain,
  Zap,
  Target,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getLevelInfo } from "../../config/gamificationConfig";
import { useNavigate } from "react-router-dom";
import styles from "./DashboardHome.module.css";

// Animation helpers
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: "easeOut" },
});

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function DashboardHome() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const firstName  = userProfile?.username?.split(" ")[0] ?? "there";
  const xp         = userProfile?.xp ?? 0;
  const levelInfo  = getLevelInfo(xp);

  const stats = [
    {
      icon: BookOpen,
      label: "Total Decks",
      value: userProfile?.totalDecks ?? 0,
      color: "purple",
      sub: "study decks created",
    },
    {
      icon: ClipboardList,
      label: "Quizzes Taken",
      value: userProfile?.quizzesTaken ?? 0,
      color: "indigo",
      sub: "quizzes completed",
    },
    {
      icon: Flame,
      label: "Day Streak",
      value: userProfile?.streak ?? 0,
      color: "pink",
      sub: "days in a row",
    },
    {
      icon: Star,
      label: "Total XP",
      value: (userProfile?.xp ?? 0).toLocaleString(),
      color: "gold",
      sub: `Level ${levelInfo.current.level} — ${levelInfo.current.title}`,
    },
  ];

  const quickActions = [
    {
      icon: Plus,
      label: "Create Deck",
      description: "Start a new study deck",
      color: "purple",
      to: "/dashboard/decks/new",
    },
    {
      icon: Zap,
      label: "Take a Quiz",
      description: "Test your knowledge",
      color: "indigo",
      to: "/dashboard/quizzes",
    },
    {
      icon: Brain,
      label: "AI Tutor",
      description: "Ask AI anything",
      color: "pink",
      to: "/dashboard/ai-tutor",
    },
    {
      icon: Target,
      label: "View Progress",
      description: "Track your growth",
      color: "green",
      to: "/dashboard/progress",
    },
  ];

  return (
    <div className={styles.page}>

      {/* ===== WELCOME BANNER ===== */}
      <motion.div className={styles.welcomeBanner} {...fadeUp(0)}>
        <div className={styles.welcomeText}>
          <p className={styles.welcomeGreeting}>
            {getGreeting()}, <span className="gradient-text">{firstName}</span> 👋
          </p>
          <p className={styles.welcomeSub}>
            Ready to level up your knowledge today?
          </p>
        </div>
        <div className={styles.welcomeIllustration}>
          <div className={styles.orbSmall} />
          <Brain size={52} className={styles.brainIcon} />
        </div>
      </motion.div>

      {/* ===== STATS GRID ===== */}
      <motion.div
        className={styles.statsGrid}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {stats.map(({ icon: Icon, label, value, color, sub }) => (
          <motion.div
            key={label}
            className={`${styles.statCard} ${styles[`statCard_${color}`]}`}
            variants={staggerItem}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <div className={`${styles.statIcon} ${styles[`statIcon_${color}`]}`}>
              <Icon size={20} />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statValue}>{value.toLocaleString()}</p>
              <p className={styles.statLabel}>{label}</p>
              <p className={styles.statSub}>{sub}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ===== QUICK ACTIONS ===== */}
      <motion.div {...fadeUp(0.2)}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Quick Actions</h3>
        </div>
        <motion.div
          className={styles.actionsGrid}
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {quickActions.map(({ icon: Icon, label, description, color, to }) => (
            <motion.button
              key={label}
              className={`${styles.actionCard} ${styles[`actionCard_${color}`]}`}
              variants={staggerItem}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(to)}
            >
              <div className={`${styles.actionIcon} ${styles[`actionIcon_${color}`]}`}>
                <Icon size={22} />
              </div>
              <div className={styles.actionText}>
                <p className={styles.actionLabel}>{label}</p>
                <p className={styles.actionDesc}>{description}</p>
              </div>
              <ArrowRight size={16} className={styles.actionArrow} />
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* ===== RECENT ACTIVITY ===== */}
      <motion.div {...fadeUp(0.3)}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Recent Activity</h3>
          <button
            className={styles.seeAllBtn}
            onClick={() => navigate("/dashboard/progress")}
          >
            See all <ArrowRight size={14} />
          </button>
        </div>

        <div className={styles.activityCard}>
          {/* Empty state */}
          <div className={styles.emptyActivity}>
            <TrendingUp size={40} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>No activity yet</p>
            <p className={styles.emptySub}>
              Create your first deck or take a quiz to see your activity here.
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate("/dashboard/decks/new")}
            >
              <span>Create First Deck</span>
            </button>
          </div>
        </div>
      </motion.div>

    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
