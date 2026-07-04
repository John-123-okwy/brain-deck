import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon, Lock, Bell,
  Moon, Sun, Trash2, Loader,
  Check, X, AlertTriangle, Crown, Sparkles,
} from "lucide-react";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { db } from "../../firebase/config";
import { useNavigate } from "react-router-dom";
import UpgradeModal from "../../components/ui/UpgradeModal";
import styles from "./Settings.module.css";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" },
});

export default function Settings() {
  const { currentUser, userProfile, updateUserProfile, logout, isPro } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Password change
  const [currentPwd, setCurrentPwd]   = useState("");
  const [newPwd, setNewPwd]           = useState("");
  const [confirmPwd, setConfirmPwd]   = useState("");
  const [pwdLoading, setPwdLoading]   = useState(false);
  const [pwdSuccess, setPwdSuccess]   = useState(false);
  const [pwdError, setPwdError]       = useState("");

  // Notifications
  const [notifStudy, setNotifStudy]   = useState(userProfile?.notifStudy   ?? true);
  const [notifQuiz, setNotifQuiz]     = useState(userProfile?.notifQuiz    ?? true);
  const [notifStreak, setNotifStreak] = useState(userProfile?.notifStreak  ?? true);
  const [notifSaving, setNotifSaving] = useState(false);

  // Delete account
  const [deleteStep, setDeleteStep]   = useState(0); // 0 = hidden, 1 = confirm, 2 = password
  const [deletePwd, setDeletePwd]     = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const pro = isPro();

  // ── Change password ──
  async function handleChangePassword(e) {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess(false);

    if (!currentPwd) return setPwdError("Current password is required.");
    if (newPwd.length < 6) return setPwdError("New password must be at least 6 characters.");
    if (newPwd !== confirmPwd) return setPwdError("Passwords do not match.");

    try {
      setPwdLoading(true);
      const credential = EmailAuthProvider.credential(currentUser.email, currentPwd);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPwd);
      setPwdSuccess(true);
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPwdError("Current password is incorrect.");
      } else {
        setPwdError("Failed to update password. Try again.");
      }
    } finally {
      setPwdLoading(false);
    }
  }

  // ── Save notifications ──
  async function saveNotifications(key, value) {
    try {
      setNotifSaving(true);
      await updateUserProfile({ [key]: value });
    } catch {
      // silent
    } finally {
      setNotifSaving(false);
    }
  }

  // ── Delete account ──
  async function handleDeleteAccount() {
    setDeleteError("");
    try {
      setDeleteLoading(true);
      const credential = EmailAuthProvider.credential(currentUser.email, deletePwd);
      await reauthenticateWithCredential(currentUser, credential);
      // Delete Firestore user doc
      await deleteDoc(doc(db, "users", currentUser.uid));
      // Delete auth account
      await deleteUser(currentUser);
      navigate("/login");
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setDeleteError("Password is incorrect.");
      } else {
        setDeleteError("Failed to delete account. Please try again.");
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className={styles.page}>

      {/* Page header */}
      <motion.div className={styles.pageHeader} {...fadeUp(0)}>
        <div className={styles.headerIcon}>
          <SettingsIcon size={22} color="white" />
        </div>
        <div>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSub}>Manage your account preferences</p>
        </div>
      </motion.div>

      {/* ── Appearance ── */}
      <motion.div className={styles.card} {...fadeUp(0.05)}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleRow}>
            {darkMode ? <Moon size={18} className={styles.cardIcon} /> : <Sun size={18} className={styles.cardIcon} />}
            <h3 className={styles.cardTitle}>Appearance</h3>
          </div>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <p className={styles.settingLabel}>Dark Mode</p>
            <p className={styles.settingSub}>Switch between dark and light theme</p>
          </div>
          <button
            className={`${styles.toggle} ${darkMode ? styles.toggleOn : ""}`}
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            <motion.div
              className={styles.toggleThumb}
              animate={{ x: darkMode ? 22 : 2 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          </button>
        </div>
      </motion.div>

      {/* ── Plan ── */}
      <motion.div className={styles.card} {...fadeUp(0.08)}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleRow}>
            {pro ? <Crown size={18} className={styles.cardIconGold} /> : <Sparkles size={18} className={styles.cardIcon} />}
            <h3 className={styles.cardTitle}>Plan & Credits</h3>
          </div>
        </div>

        <div className={styles.planRow}>
          <div>
            <p className={styles.settingLabel}>{pro ? "Pro Plan" : "Free Plan"}</p>
            <p className={styles.settingSub}>
              {pro
                ? "You have access to all features and 50 AI credits/month"
                : `${userProfile?.aiCredits ?? 0} AI credits remaining · Max 5 decks · Max 3 courses`}
            </p>
          </div>
          {!pro && (
            <button className={styles.upgradeInlineBtn} onClick={() => setUpgradeOpen(true)}>
              <Crown size={14} /> Upgrade
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Notifications ── */}
      <motion.div className={styles.card} {...fadeUp(0.1)}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleRow}>
            <Bell size={18} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Notifications</h3>
          </div>
          {notifSaving && <Loader size={15} className={styles.spinner} />}
        </div>

        {[
          { key: "notifStudy",  label: "Study reminders",     sub: "Daily reminder to study",           value: notifStudy,   set: setNotifStudy },
          { key: "notifQuiz",   label: "Quiz notifications",   sub: "Notify when a quiz is ready",       value: notifQuiz,    set: setNotifQuiz },
          { key: "notifStreak", label: "Streak alerts",        sub: "Don't lose your study streak",      value: notifStreak,  set: setNotifStreak },
        ].map(({ key, label, sub, value, set }) => (
          <div key={key} className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <p className={styles.settingLabel}>{label}</p>
              <p className={styles.settingSub}>{sub}</p>
            </div>
            <button
              className={`${styles.toggle} ${value ? styles.toggleOn : ""}`}
              onClick={() => {
                set(!value);
                saveNotifications(key, !value);
              }}
            >
              <motion.div
                className={styles.toggleThumb}
                animate={{ x: value ? 22 : 2 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            </button>
          </div>
        ))}
      </motion.div>

      {/* ── Change password ── */}
      <motion.div className={styles.card} {...fadeUp(0.15)}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleRow}>
            <Lock size={18} className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Change Password</h3>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className={styles.pwdForm}>
          {pwdError && (
            <div className={styles.errorBox}>
              <X size={14} /> {pwdError}
            </div>
          )}
          {pwdSuccess && (
            <div className={styles.successBox}>
              <Check size={14} /> Password updated successfully!
            </div>
          )}

          {[
            { label: "Current Password",  value: currentPwd, set: setCurrentPwd, auto: "current-password" },
            { label: "New Password",      value: newPwd,     set: setNewPwd,     auto: "new-password" },
            { label: "Confirm New Password", value: confirmPwd, set: setConfirmPwd, auto: "new-password" },
          ].map(({ label, value, set, auto }) => (
            <div key={label} className={styles.field}>
              <label className={styles.fieldLabel}>{label}</label>
              <input
                type="password"
                className="input-base"
                value={value}
                onChange={(e) => { set(e.target.value); setPwdError(""); setPwdSuccess(false); }}
                autoComplete={auto}
                placeholder="••••••••"
              />
            </div>
          ))}

          <button type="submit" className="btn-primary" disabled={pwdLoading} style={{ alignSelf: "flex-start" }}>
            {pwdLoading
              ? <><Loader size={15} className={styles.spinner} /><span>Updating...</span></>
              : <span>Update Password</span>
            }
          </button>
        </form>
      </motion.div>

      {/* ── Danger zone ── */}
      <motion.div className={`${styles.card} ${styles.dangerCard}`} {...fadeUp(0.2)}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleRow}>
            <AlertTriangle size={18} className={styles.cardIconRed} />
            <h3 className={`${styles.cardTitle} ${styles.cardTitleRed}`}>Danger Zone</h3>
          </div>
        </div>

        <div className={styles.dangerRow}>
          <div>
            <p className={styles.settingLabel}>Delete Account</p>
            <p className={styles.settingSub}>
              Permanently delete your account and all data. This cannot be undone.
            </p>
          </div>
          <button
            className={styles.deleteAccountBtn}
            onClick={() => setDeleteStep(1)}
          >
            <Trash2 size={14} /> Delete Account
          </button>
        </div>

        {/* Step 1 — Confirm */}
        {deleteStep === 1 && (
          <motion.div
            className={styles.deleteConfirm}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className={styles.deleteConfirmText}>
              ⚠️ Are you sure? All your decks, courses, quizzes and progress will be permanently deleted.
            </p>
            <div className={styles.deleteConfirmBtns}>
              <button className="btn-secondary" onClick={() => setDeleteStep(0)}>Cancel</button>
              <button className={styles.deleteConfirmBtn} onClick={() => setDeleteStep(2)}>
                Yes, delete my account
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2 — Password */}
        {deleteStep === 2 && (
          <motion.div
            className={styles.deleteConfirm}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className={styles.deleteConfirmText}>
              Enter your password to confirm deletion:
            </p>
            {deleteError && (
              <div className={styles.errorBox}><X size={14} /> {deleteError}</div>
            )}
            <input
              type="password"
              className="input-base"
              placeholder="Your password"
              value={deletePwd}
              onChange={(e) => { setDeletePwd(e.target.value); setDeleteError(""); }}
              autoFocus
            />
            <div className={styles.deleteConfirmBtns}>
              <button className="btn-secondary" onClick={() => { setDeleteStep(0); setDeletePwd(""); setDeleteError(""); }}>
                Cancel
              </button>
              <button
                className={styles.deleteConfirmBtn}
                onClick={handleDeleteAccount}
                disabled={deleteLoading || !deletePwd}
              >
                {deleteLoading
                  ? <><Loader size={14} className={styles.spinner} /><span>Deleting...</span></>
                  : <><Trash2 size={14} /><span>Permanently Delete</span></>
                }
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        reason="Upgrade to Pro for unlimited access to all features."
      />
    </div>
  );
}
