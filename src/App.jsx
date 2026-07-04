import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import Signup from "./pages/Auth/Signup";
import Login from "./pages/Auth/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardHome from "./pages/Dashboard/DashboardHome";
import MyDecks from "./pages/Decks/MyDecks";
import DeckDetail from "./pages/Decks/DeckDetail";
import StudyMode from "./pages/Decks/StudyMode";
import QuizSetup from "./pages/Quiz/QuizSetup";
import QuizSession from "./pages/Quiz/QuizSession";
import Progress from "./pages/Progress/Progress";
import MyCourses from "./pages/Courses/MyCourses";
import CourseDetail from "./pages/Courses/CourseDetail";
import CourseStudyMode from "./pages/Courses/CourseStudyMode";
import AITutor from "./pages/AITutor/AITutor";
import Profile from "./pages/Profile/Profile";
import Settings from "./pages/Settings/Settings";
import Notifications from "./pages/Notifications/Notifications";
import Achievements from "./pages/Achievements/Achievements";
import History from "./pages/History/History";
import Onboarding from "./pages/Onboarding/Onboarding";
import Landing from "./pages/Landing/Landing";

// ── Show onboarding once for new users ──
function OnboardingGate({ children }) {
  const { userProfile, currentUser } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (currentUser && userProfile && !userProfile.onboardingComplete) {
      setShowOnboarding(true);
    }
  }, [currentUser, userProfile]);

  return (
    <>
      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}
      {children}
    </>
  );
}

function ComingSoon({ page }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "60vh", gap: "12px", textAlign: "center"
    }}>
      <div style={{ fontSize: "3rem", marginBottom: "8px" }}>🚧</div>
      <h2 style={{ color: "var(--text-primary)", fontSize: "1.4rem", fontWeight: 700 }}>{page}</h2>
      <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Coming in the next phase!</p>
    </div>
  );
}

export default function App() {
  return (
    <OnboardingGate>
      <Routes>
        <Route path="/"       element={<Landing />} />
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />

          {/* Decks */}
          <Route path="decks"               element={<MyDecks />} />
          <Route path="decks/:deckId"       element={<DeckDetail />} />
          <Route path="decks/:deckId/study" element={<StudyMode />} />

          {/* Quizzes */}
          <Route path="quizzes"         element={<QuizSetup />} />
          <Route path="quizzes/session" element={<QuizSession />} />
          <Route path="quizzes/:deckId" element={<QuizSession />} />

          {/* Progress */}
          <Route path="progress" element={<Progress />} />

          {/* Courses */}
          <Route path="courses"                    element={<MyCourses />} />
          <Route path="courses/:courseId"          element={<CourseDetail />} />
          <Route path="courses/:courseId/study"    element={<CourseStudyMode />} />
          <Route path="courses/:courseId/progress" element={<Navigate to="/dashboard/progress" replace />} />

          {/* AI Tutor */}
          <Route path="ai-tutor" element={<AITutor />} />

          {/* Profile & Settings */}
          <Route path="profile"  element={<Profile />} />
          <Route path="settings" element={<Settings />} />

          {/* History, Notifications, Achievements */}
          <Route path="history"       element={<History />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="achievements"  element={<Achievements />} />

          {/* Coming soon */}
          <Route path="community"  element={<ComingSoon page="Community" />} />
          <Route path="leaderboard" element={<ComingSoon page="Leaderboard" />} />
          <Route path="help"       element={<ComingSoon page="Help & FAQ" />} />
        </Route>
      </Routes>
    </OnboardingGate>
  );
}
