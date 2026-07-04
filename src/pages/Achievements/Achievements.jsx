import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Trophy, Lock, Star, Loader, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getUnlockedAchievements } from "../../services/gamificationService";
import { getLevelInfo, ACHIEVEMENTS, LEVELS } from "../../config/gamificationConfig";
import styles from "./Achievements.module.css";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" },
});

const colorMap = {
  purple: { bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.3)",  text: "var(--purple-light)"  },
  indigo: { bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.3)",  text: "var(--indigo-accent)" },
  blue:   { bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)",  text: "#3b82f6"              },
  green:  { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.3)",  text: "var(--success)"       },
  gold:   { bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)",  text: "#fbbf24"              },
  orange: { bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.3)",  text: "#fb923c"              },
  pink:   { bg: "rgba(232,121,249,0.12)", border: "rgba(232,121,249,0.3)", text: "var(--pink-accent)"   },
};

export default function Achievements() {
  const { currentUser, userProfile } = useAuth();

  const [unlockedIds, setUnlockedIds] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [filter, setFilter]           = useState("all"); // all | unlocked | locked

  const xp        = userProfile?.xp ?? 0;
  const levelInfo = getLevelInfo(xp);

  const fetchUnlocked = useCallback(async () => {
    try {
      setLoading(true);
      const ids = await getUnlockedAchievements(currentUser.uid);
      setUnlockedIds(ids);
    } catch {
      setError("Failed to load achievements.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchUnlocked(); }, [fetchUnlocked]);

  const unlockedCount = unlockedIds.length;
  const totalCount    = ACHIEVEMENTS.length;

  const filtered = ACHIEVEMENTS.filter((a) => {
    if (filter === "unlocked") return unlockedIds.includes(a.id);
    if (filter === "locked")   return !unlockedIds.includes(a.id);
    return true;
  });

  return (
    <div className={styles.page}>

      {/* Page header */}
      <motion.div className={styles.pageHeader} {...fadeUp(0)}>
        <div className={styles.headerIcon}>
          <Trophy size={22} color="white" />
        </div>
        <div>
          <h1 className={styles.pageTitle}>Achievements</h1>
          <p className={styles.pageSub}>
            {unlockedCount} of {totalCount} achievements unlocked
          </p>
        </div>
      </motion.div>

      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Level card */}
      <motion.div className={styles.levelCard} {...fadeUp(0.05)}>
        <div className={styles.levelLeft}>
          <div className={styles.levelBadge}>
            <span className={styles.levelNum}>{levelInfo.current.level}</span>
          </div>
          <div>
            <p className={styles.levelTitle}>{levelInfo.current.title}</p>
            <p className={styles.levelXP}>
              {xp.toLocaleString()} XP
              {levelInfo.next && (
                <span className={styles.levelNext}>
                  {" "}· {(levelInfo.next.minXP - xp).toLocaleString()} XP to {levelInfo.next.title}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className={styles.levelRight}>
          <div className={styles.xpBarWrap}>
            <div className={styles.xpBar}>
              <motion.div
                className={styles.xpBarFill}
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progress}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              />
            </div>
            <span className={styles.xpPct}>{levelInfo.progress}%</span>
          </div>

          {/* Level milestones row */}
          <div className={styles.levelsRow}>
            {LEVELS.slice(0, 5).map((l) => (
              <div
                key={l.level}
                className={`${styles.levelPip} ${levelInfo.current.level >= l.level ? styles.levelPipDone : ""}`}
                title={`Level ${l.level}: ${l.title}`}
              >
                {l.level}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Filter tabs */}
      <motion.div className={styles.filterRow} {...fadeUp(0.1)}>
        {[
          { id: "all",      label: `All (${totalCount})` },
          { id: "unlocked", label: `Unlocked (${unlockedCount})` },
          { id: "locked",   label: `Locked (${totalCount - unlockedCount})` },
        ].map(({ id, label }) => (
          <button
            key={id}
            className={`${styles.filterBtn} ${filter === id ? styles.filterBtnActive : ""}`}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {/* Achievements grid */}
      {loading ? (
        <div className={styles.centerState}>
          <Loader size={28} className={styles.spinner} />
          <p>Loading achievements...</p>
        </div>
      ) : (
        <motion.div
          className={styles.grid}
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
        >
          {filtered.map((achievement) => {
            const isUnlocked = unlockedIds.includes(achievement.id);
            const colors     = colorMap[achievement.color] ?? colorMap.purple;

            return (
              <motion.div
                key={achievement.id}
                className={`${styles.achievementCard} ${isUnlocked ? styles.achievementCardUnlocked : styles.achievementCardLocked}`}
                style={isUnlocked ? { borderColor: colors.border } : {}}
                variants={{
                  initial: { opacity: 0, y: 16 },
                  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                }}
                whileHover={{ y: isUnlocked ? -3 : 0 }}
              >
                {/* Icon */}
                <div
                  className={styles.achievementIcon}
                  style={isUnlocked
                    ? { background: colors.bg, border: `1px solid ${colors.border}` }
                    : {}
                  }
                >
                  {isUnlocked
                    ? <span className={styles.achievementEmoji}>{achievement.icon}</span>
                    : <Lock size={20} className={styles.lockIcon} />
                  }
                </div>

                {/* Info */}
                <div className={styles.achievementInfo}>
                  <p
                    className={styles.achievementTitle}
                    style={isUnlocked ? { color: colors.text } : {}}
                  >
                    {achievement.title}
                  </p>
                  <p className={styles.achievementDesc}>{achievement.description}</p>
                </div>

                {/* XP reward */}
                {achievement.xpReward > 0 && (
                  <div
                    className={styles.xpReward}
                    style={isUnlocked
                      ? { background: colors.bg, color: colors.text, borderColor: colors.border }
                      : {}
                    }
                  >
                    <Star size={11} />
                    <span>{achievement.xpReward} XP</span>
                  </div>
                )}

                {/* Unlocked checkmark */}
                {isUnlocked && (
                  <div className={styles.unlockedBadge} style={{ background: colors.bg, color: colors.text }}>
                    ✓
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
