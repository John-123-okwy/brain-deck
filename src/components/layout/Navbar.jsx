import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, Sun, Moon, Bell,
  ChevronDown, User, Settings, LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import CreditBadge from "../ui/CreditBadge";
import { getUnreadCount } from "../../services/notificationService";
import UpgradeModal from "../ui/UpgradeModal";
import styles from "./Navbar.module.css";

const pageTitles = {
  "/dashboard":              "Dashboard",
  "/dashboard/decks":        "My Decks",
  "/dashboard/courses":      "My Courses",
  "/dashboard/quizzes":      "Quizzes",
  "/dashboard/progress":     "Progress",
  "/dashboard/ai-tutor":     "AI Tutor",
  "/dashboard/settings":     "Settings",
  "/dashboard/profile":      "Profile",
  "/dashboard/history":      "My History",
  "/dashboard/achievements": "Achievements",
  "/dashboard/leaderboard":  "Leaderboard",
  "/dashboard/notifications":"Notifications",
  "/dashboard/help":         "Help & FAQ",
};

export default function Navbar({ onMenuClick }) {
  const { currentUser, userProfile, logout } = useAuth();
  const { darkMode, toggleTheme }            = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [dropdownOpen, setDropdownOpen]     = useState(false);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [upgradeOpen, setUpgradeOpen]       = useState(false);
  const dropdownRef = useRef(null);

  const pageTitle = pageTitles[location.pathname] ?? "BrainDeck";

  const initials = userProfile?.username
    ? userProfile.username.slice(0, 2).toUpperCase()
    : currentUser?.email?.slice(0, 2).toUpperCase() ?? "BD";

  // Fetch unread notification count
  useEffect(() => {
    if (!currentUser) return;
    getUnreadCount(currentUser.uid)
      .then(setUnreadCount)
      .catch(() => {});
  }, [currentUser]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  return (
    <>
      <header className={styles.navbar}>

        {/* Left */}
        <div className={styles.left}>
          <button className={styles.menuBtn} onClick={onMenuClick} aria-label="Toggle menu">
            <Menu size={21} />
          </button>
          <h2 className={styles.pageTitle}>{pageTitle}</h2>
        </div>

        {/* Right */}
        <div className={styles.right}>

          {/* Credit badge */}
          <CreditBadge onClick={() => setUpgradeOpen(true)} />

          {/* Theme toggle */}
          <motion.button
            className={styles.iconBtn}
            onClick={toggleTheme}
            aria-label="Toggle theme"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
          >
            <AnimatePresence mode="wait">
              {darkMode ? (
                <motion.span
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun size={18} />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon size={18} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Notifications */}
          <button
            className={styles.iconBtn}
            aria-label="Notifications"
            onClick={() => navigate("/dashboard/notifications")}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className={styles.notifBadge}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* User dropdown */}
          <div className={styles.userMenu} ref={dropdownRef}>
            <button
              className={styles.userBtn}
              onClick={() => setDropdownOpen((p) => !p)}
              aria-label="User menu"
            >
              <div className={styles.avatar}>{initials}</div>
              <span className={styles.userName}>
                {userProfile?.username ?? "User"}
              </span>
              <motion.span
                animate={{ rotate: dropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={15} />
              </motion.span>
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  className={styles.dropdown}
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <div className={styles.dropdownHeader}>
                    <div className={styles.dropdownAvatar}>{initials}</div>
                    <div>
                      <p className={styles.dropdownName}>
                        {userProfile?.username ?? "User"}
                      </p>
                      <p className={styles.dropdownEmail}>
                        {currentUser?.email ?? ""}
                      </p>
                    </div>
                  </div>

                  <div className={styles.dropdownDivider} />

                  <button
                    className={styles.dropdownItem}
                    onClick={() => { navigate("/dashboard/profile"); setDropdownOpen(false); }}
                  >
                    <User size={15} /><span>Profile</span>
                  </button>

                  <button
                    className={styles.dropdownItem}
                    onClick={() => { navigate("/dashboard/settings"); setDropdownOpen(false); }}
                  >
                    <Settings size={15} /><span>Settings</span>
                  </button>

                  <div className={styles.dropdownDivider} />

                  <button
                    className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                    onClick={handleLogout}
                  >
                    <LogOut size={15} /><span>Log Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Upgrade modal */}
      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
      />
    </>
  );
}
