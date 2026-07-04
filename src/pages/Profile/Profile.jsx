import { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Edit2, Check, X,
  Loader, BookOpen, ClipboardList,
  Flame, Star, Crown, Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import UpgradeModal from "../../components/ui/UpgradeModal";
import styles from "./Profile.module.css";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" },
});

const STUDY_GOALS = [
  "Study 15 mins/day",
  "Study 30 mins/day",
  "Study 1 hour/day",
  "Complete 1 quiz/day",
  "Complete 3 quizzes/week",
  "Finish a course/month",
];

export default function Profile() {
  const { currentUser, userProfile, updateUserProfile, isPro } = useAuth();
  const navigate = useNavigate();

  const [editingUsername, setEditingUsername] = useState(false);
  const [editingBio, setEditingBio]           = useState(false);
  const [username, setUsername]               = useState(userProfile?.username ?? "");
  const [bio, setBio]                         = useState(userProfile?.bio ?? "");
  const [studyGoal, setStudyGoal]             = useState(userProfile?.studyGoal ?? "");
  const [saving, setSaving]                   = useState("");
  const [error, setError]                     = useState("");
  const [upgradeOpen, setUpgradeOpen]         = useState(false);

  const pro      = isPro();
  const credits  = userProfile?.aiCredits ?? 0;
  const initials = userProfile?.username
    ? userProfile.username.slice(0, 2).toUpperCase()
    : "BD";

  async function saveUsername() {
    if (!username.trim() || username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    try {
      setSaving("username");
      await updateUserProfile({ username: username.trim() });
      setEditingUsername(false);
      setError("");
    } catch {
      setError("Failed to update username.");
    } finally {
      setSaving("");
    }
  }

  async function saveBio() {
    try {
      setSaving("bio");
      await updateUserProfile({ bio: bio.trim() });
      setEditingBio(false);
      setError("");
    } catch {
      setError("Failed to update bio.");
    } finally {
      setSaving("");
    }
  }

  async function saveStudyGoal(goal) {
    try {
      setStudyGoal(goal);
      await updateUserProfile({ studyGoal: goal });
    } catch {
      setError("Failed to update study goal.");
    }
  }

  const stats = [
    { icon: BookOpen,      label: "Decks",        value: userProfile?.totalDecks   ?? 0, color: "purple" },
    { icon: ClipboardList, label: "Quizzes",       value: userProfile?.quizzesTaken ?? 0, color: "indigo" },
    { icon: Flame,         label: "Day Streak",    value: userProfile?.streak       ?? 0, color: "pink"   },
    { icon: Star,          label: "XP",            value: userProfile?.xp           ?? 0, color: "gold"   },
  ];

  return (
    <div className={styles.page}>

      {/* ── Page header ── */}
      <motion.div className={styles.pageHeader} {...fadeUp(0)}>
        <div className={styles.headerIcon}>
          <User size={22} color="white" />
        </div>
        <div>
          <h1 className={styles.pageTitle}>Profile</h1>
          <p className={styles.pageSub}>Manage your personal information</p>
        </div>
      </motion.div>

      {error && (
        <div className={styles.errorBox}>
          <X size={15} /> {error}
          <button onClick={() => setError("")} className={styles.errorDismiss}>✕</button>
        </div>
      )}

      <div className={styles.grid}>

        {/* ── Left column ── */}
        <div className={styles.leftCol}>

          {/* Avatar card */}
          <motion.div className={styles.avatarCard} {...fadeUp(0.05)}>
            <div className={styles.avatarCircle}>
              <span className={styles.avatarInitials}>{initials}</span>
              <div className={styles.avatarGlow} />
            </div>

            {/* Username */}
            <div className={styles.usernameRow}>
              {editingUsername ? (
                <div className={styles.inlineEdit}>
                  <input
                    className={`input-base ${styles.inlineInput}`}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={30}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveUsername();
                      if (e.key === "Escape") { setEditingUsername(false); setUsername(userProfile?.username ?? ""); }
                    }}
                  />
                  <button className={styles.inlineSave} onClick={saveUsername} disabled={saving === "username"}>
                    {saving === "username" ? <Loader size={14} className={styles.spinner} /> : <Check size={14} />}
                  </button>
                  <button className={styles.inlineCancel} onClick={() => { setEditingUsername(false); setUsername(userProfile?.username ?? ""); }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <h2 className={styles.profileUsername}>{userProfile?.username ?? "User"}</h2>
                  <button className={styles.editIconBtn} onClick={() => setEditingUsername(true)}>
                    <Edit2 size={14} />
                  </button>
                </>
              )}
            </div>

            {/* Email */}
            <div className={styles.emailRow}>
              <Mail size={14} className={styles.emailIcon} />
              <span className={styles.emailText}>{currentUser?.email}</span>
            </div>

            {/* Plan badge */}
            <div
              className={`${styles.planBadge} ${pro ? styles.planBadgePro : styles.planBadgeFree}`}
              onClick={() => !pro && setUpgradeOpen(true)}
              style={{ cursor: pro ? "default" : "pointer" }}
            >
              {pro
                ? <><Crown size={13} /> Pro Plan</>
                : <><Sparkles size={13} /> Free Plan — Upgrade</>
              }
            </div>

            {/* Credits */}
            {!pro && (
              <div className={styles.creditRow}>
                <Sparkles size={13} style={{ color: "var(--purple-light)" }} />
                <span className={styles.creditText}>
                  <strong>{credits}</strong> AI credit{credits !== 1 ? "s" : ""} remaining
                </span>
              </div>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div className={styles.statsCard} {...fadeUp(0.1)}>
            <h3 className={styles.cardTitle}>Your Stats</h3>
            <div className={styles.statsGrid}>
              {stats.map(({ icon: Icon, label, value, color }) => (
                <div key={label} className={`${styles.statItem} ${styles[`statItem_${color}`]}`}>
                  <div className={`${styles.statIcon} ${styles[`statIcon_${color}`]}`}>
                    <Icon size={16} />
                  </div>
                  <p className={styles.statValue}>{value.toLocaleString()}</p>
                  <p className={styles.statLabel}>{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* ── Right column ── */}
        <div className={styles.rightCol}>

          {/* Bio */}
          <motion.div className={styles.card} {...fadeUp(0.1)}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Bio</h3>
              {!editingBio && (
                <button className={styles.editBtn} onClick={() => setEditingBio(true)}>
                  <Edit2 size={14} /> Edit
                </button>
              )}
            </div>

            {editingBio ? (
              <div className={styles.bioEditWrap}>
                <textarea
                  className={`input-base ${styles.bioTextarea}`}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a little about yourself..."
                  maxLength={200}
                  rows={3}
                  autoFocus
                />
                <div className={styles.bioMeta}>
                  <span>{bio.length}/200</span>
                  <div className={styles.bioActions}>
                    <button className="btn-secondary" onClick={() => { setEditingBio(false); setBio(userProfile?.bio ?? ""); }}>
                      Cancel
                    </button>
                    <button className="btn-primary" onClick={saveBio} disabled={saving === "bio"}>
                      {saving === "bio" ? <><Loader size={14} className={styles.spinner} /><span>Saving...</span></> : <span>Save</span>}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className={styles.bioText}>
                {userProfile?.bio || <span className={styles.bioEmpty}>No bio yet. Click Edit to add one.</span>}
              </p>
            )}
          </motion.div>

          {/* Study goal */}
          <motion.div className={styles.card} {...fadeUp(0.15)}>
            <h3 className={styles.cardTitle}>Study Goal</h3>
            <p className={styles.cardSub}>Pick a daily study target to stay motivated</p>
            <div className={styles.goalGrid}>
              {STUDY_GOALS.map((goal) => (
                <button
                  key={goal}
                  className={`${styles.goalBtn} ${studyGoal === goal ? styles.goalBtnActive : ""}`}
                  onClick={() => saveStudyGoal(goal)}
                >
                  {studyGoal === goal && <Check size={13} className={styles.goalCheck} />}
                  {goal}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Account info */}
          <motion.div className={styles.card} {...fadeUp(0.2)}>
            <h3 className={styles.cardTitle}>Account</h3>
            <div className={styles.accountRows}>
              <div className={styles.accountRow}>
                <span className={styles.accountLabel}>Email</span>
                <span className={styles.accountValue}>{currentUser?.email}</span>
              </div>
              <div className={styles.accountRow}>
                <span className={styles.accountLabel}>Member since</span>
                <span className={styles.accountValue}>
                  {userProfile?.createdAt
                    ? new Date(userProfile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                    : "—"}
                </span>
              </div>
              <div className={styles.accountRow}>
                <span className={styles.accountLabel}>Plan</span>
                <span className={styles.accountValue}>{pro ? "Pro" : "Free"}</span>
              </div>
            </div>
            <div className={styles.accountBtns}>
              <button
                className="btn-secondary"
                onClick={() => navigate("/dashboard/settings")}
              >
                Account Settings
              </button>
              {!pro && (
                <button className="btn-primary" onClick={() => setUpgradeOpen(true)}>
                  <Crown size={14} /><span>Upgrade to Pro</span>
                </button>
              )}
            </div>
          </motion.div>

        </div>
      </div>

      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        reason="Upgrade to Pro for unlimited decks, cards, and AI features."
      />
    </div>
  );
}
