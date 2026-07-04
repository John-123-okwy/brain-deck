import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Brain, Loader, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import styles from "./Auth.module.css";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");

  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.email) return setError("Email is required.");
    if (!formData.password) return setError("Password is required.");

    try {
      setLoading(true);
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (err) {
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Incorrect email or password.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError("Failed to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (!forgotEmail) return setResetError("Please enter your email address.");

    try {
      setResetLoading(true);
      setResetError("");
      await resetPassword(forgotEmail);
      setResetSent(true);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setResetError("No account found with this email.");
      } else if (err.code === "auth/invalid-email") {
        setResetError("Please enter a valid email address.");
      } else {
        setResetError("Failed to send reset email. Try again.");
      }
    } finally {
      setResetLoading(false);
    }
  }

  // ---- FORGOT PASSWORD VIEW ----
  if (showForgot) {
    return (
      <div className={styles.authPage}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />

        <motion.div
          className={styles.authCard}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className={styles.logoArea}>
            <div className={styles.logoIcon}>
              <Brain size={28} color="white" />
            </div>
            <h1 className={styles.logoText}>
              Brain<span className="gradient-text">Deck</span>
            </h1>
          </div>

          {resetSent ? (
            <motion.div
              className={styles.successBox}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <CheckCircle size={40} color="var(--success)" />
              <h2 className={styles.title}>Check your email</h2>
              <p className={styles.subtitle}>
                We sent a password reset link to <strong>{forgotEmail}</strong>.
                Check your inbox and follow the instructions.
              </p>
              <button
                className={`btn-primary ${styles.submitBtn}`}
                onClick={() => { setShowForgot(false); setResetSent(false); }}
              >
                <span>Back to Sign In</span>
              </button>
            </motion.div>
          ) : (
            <>
              <h2 className={styles.title}>Reset your password</h2>
              <p className={styles.subtitle}>
                Enter your email and we'll send you a reset link
              </p>

              {resetError && (
                <motion.div
                  className={styles.errorBox}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {resetError}
                </motion.div>
              )}

              <form onSubmit={handleResetPassword} className={styles.form}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Email</label>
                  <div className={styles.inputWrapper}>
                    <Mail size={17} className={styles.inputIcon} />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={(e) => { setForgotEmail(e.target.value); setResetError(""); }}
                      className={`input-base ${styles.inputWithIcon}`}
                      autoFocus
                    />
                  </div>
                </div>

                <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={resetLoading}>
                  {resetLoading ? (
                    <>
                      <Loader size={17} className={styles.spinner} />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </form>

              <p className={styles.switchText}>
                <button className={styles.linkBtn} onClick={() => setShowForgot(false)}>
                  ← Back to Sign In
                </button>
              </p>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  // ---- LOGIN VIEW ----
  return (
    <div className={styles.authPage}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      <motion.div
        className={styles.authCard}
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className={styles.logoArea}>
          <motion.div
            className={styles.logoIcon}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Brain size={28} color="white" />
          </motion.div>
          <h1 className={styles.logoText}>
            Brain<span className="gradient-text">Deck</span>
          </h1>
        </div>

        <h2 className={styles.title}>Welcome back</h2>
        <p className={styles.subtitle}>Sign in to continue learning</p>

        {error && (
          <motion.div
            className={styles.errorBox}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Email</label>
            <div className={styles.inputWrapper}>
              <Mail size={17} className={styles.inputIcon} />
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className={`input-base ${styles.inputWithIcon}`}
                autoComplete="email"
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label className={styles.label}>Password</label>
              <button
                type="button"
                className={styles.forgotBtn}
                onClick={() => { setShowForgot(true); setForgotEmail(formData.email); }}
              >
                Forgot password?
              </button>
            </div>
            <div className={styles.inputWrapper}>
              <Lock size={17} className={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Your password"
                value={formData.password}
                onChange={handleChange}
                className={`input-base ${styles.inputWithIcon} ${styles.inputWithToggle}`}
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword((p) => !p)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? (
              <>
                <Loader size={17} className={styles.spinner} />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <p className={styles.switchText}>
          Don't have an account?{" "}
          <Link to="/signup">Create one</Link>
        </p>
      </motion.div>
    </div>
  );
}
