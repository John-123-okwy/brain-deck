//////////////////////
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, Brain, Loader } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import styles from "./Auth.module.css";

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.username.trim()) return setError("Username is required.");
    if (formData.username.trim().length < 3) return setError("Username must be at least 3 characters.");
    if (!formData.email) return setError("Email is required.");
    if (formData.password.length < 6) return setError("Password must be at least 6 characters.");
    if (formData.password !== formData.confirmPassword) return setError("Passwords do not match.");

    try {
      setLoading(true);
      await signup(formData.email, formData.password, formData.username.trim());
      navigate("/dashboard");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.");
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.authPage}>
      {/* Floating orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      <motion.div
        className={styles.authCard}
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Logo */}
        <div className={styles.logoArea}>
          <motion.div
            className={styles.logoIcon}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
          >
            <Brain size={28} color="white" />
          </motion.div>
          <h1 className={styles.logoText}>
            Brain<span className="gradient-text">Deck</span>
          </h1>
        </div>

        <h2 className={styles.title}>Create your account</h2>
        <p className={styles.subtitle}>Start your learning journey today</p>

        {/* Error message */}
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
          {/* Username */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Username</label>
            <div className={styles.inputWrapper}>
              <User size={17} className={styles.inputIcon} />
              <input
                type="text"
                name="username"
                placeholder="e.g. braindecker99"
                value={formData.username}
                onChange={handleChange}
                className={`input-base ${styles.inputWithIcon}`}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Email */}
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

          {/* Password */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={17} className={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Min. 6 characters"
                value={formData.password}
                onChange={handleChange}
                className={`input-base ${styles.inputWithIcon} ${styles.inputWithToggle}`}
                autoComplete="new-password"
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

          {/* Confirm Password */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Confirm Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={17} className={styles.inputIcon} />
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                placeholder="Repeat your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`input-base ${styles.inputWithIcon} ${styles.inputWithToggle}`}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowConfirm((p) => !p)}
                aria-label="Toggle confirm password visibility"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? (
              <>
                <Loader size={17} className={styles.spinner} />
                <span>Creating account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
