


///
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  BarChart2,
  Sparkles,
  Settings,
  LogOut,
  X,
  User,
  History,
  GraduationCap,
  Trophy,
  Bell,
  HelpCircle,
  Star,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import styles from "./Sidebar.module.css";

const mainNav = [
  { icon: LayoutDashboard, label: "Dashboard",   to: "/dashboard" },
  { icon: BookOpen,        label: "My Decks",     to: "/dashboard/decks" },
  { icon: GraduationCap,  label: "My Courses",   to: "/dashboard/courses" },
  { icon: ClipboardList,  label: "Quizzes",       to: "/dashboard/quizzes" },
  { icon: History,        label: "My History",    to: "/dashboard/history" },
  { icon: BarChart2,      label: "Progress",      to: "/dashboard/progress" },
  { icon: Sparkles,       label: "AI Tutor",      to: "/dashboard/ai-tutor" },
];

const socialNav = [
  { icon: Users,  label: "Community",   to: "/dashboard/community" },
  { icon: Trophy, label: "Leaderboard", to: "/dashboard/leaderboard" },
  { icon: Star,   label: "Achievements",to: "/dashboard/achievements" },
];

const accountNav = [
  { icon: User,        label: "Profile",       to: "/dashboard/profile" },
  { icon: Bell,        label: "Notifications", to: "/dashboard/notifications" },
  { icon: Settings,    label: "Settings",      to: "/dashboard/settings" },
  { icon: HelpCircle,  label: "Help & FAQ",    to: "/dashboard/help" },
];

export default function Sidebar({ isOpen, onClose }) {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  const initials = userProfile?.username
    ? userProfile.username.slice(0, 2).toUpperCase()
    : currentUser?.email?.slice(0, 2).toUpperCase() ?? "BD";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* Sidebar panel */}
          <motion.aside
            className={styles.sidebar}
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
          >
            <div className={styles.inner}>

              {/* ── Header ── */}
              <div className={styles.header}>
                <div className={styles.logo}>
                  <div className={styles.logoIcon}>
                    <Brain size={20} color="white" />
                  </div>
                  <span className={styles.logoText}>
                    Brain<span className="gradient-text">Deck</span>
                  </span>
                </div>
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close sidebar">
                  <X size={18} />
                </button>
              </div>

              {/* ── User card ── */}
              <div className={styles.userCard}>
                <div className={styles.avatar}>{initials}</div>
                <div className={styles.userInfo}>
                  <p className={styles.username}>{userProfile?.username ?? "User"}</p>
                  <p className={styles.userEmail}>{currentUser?.email ?? ""}</p>
                </div>
                <div className={styles.xpBadge}>
                  <Star size={11} />
                  <span>{userProfile?.xp ?? 0} XP</span>
                </div>
              </div>

              {/* ── Scrollable nav ── */}
              <nav className={styles.nav}>

                <NavGroup label="Main">
                  {mainNav.map((item) => (
                    <NavItem key={item.to} {...item} onClose={onClose} />
                  ))}
                </NavGroup>

                <NavGroup label="Social">
                  {socialNav.map((item) => (
                    <NavItem key={item.to} {...item} onClose={onClose} />
                  ))}
                </NavGroup>

                <NavGroup label="Account">
                  {accountNav.map((item) => (
                    <NavItem key={item.to} {...item} onClose={onClose} />
                  ))}
                </NavGroup>

              </nav>

              {/* ── Footer ── */}
              <div className={styles.footer}>
                <div className={styles.divider} />
                <button className={styles.logoutBtn} onClick={handleLogout}>
                  <LogOut size={17} />
                  <span>Log Out</span>
                </button>
              </div>

            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Small helpers ── */
function NavGroup({ label, children }) {
  return (
    <div className={styles.navGroup}>
      <p className={styles.navGroupLabel}>{label}</p>
      {children}
    </div>
  );
}

function NavItem({ icon: Icon, label, to, onClose }) {
  return (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      className={({ isActive }) =>
        `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
      }
      onClick={onClose}
    >
      <Icon size={18} className={styles.navIcon} />
      <span>{label}</span>
      <span className={styles.activePill} />
    </NavLink>
  );
}

