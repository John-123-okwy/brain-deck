import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain, BookOpen, ClipboardList, BarChart2,
  Sparkles, Check, ChevronRight, Zap,
  GraduationCap, Trophy, Crown, ArrowRight,
  Star, Users, Target, Layers, Flame,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import styles from "./Landing.module.css";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay, ease: "easeOut" },
});

// ── Testimonials ──
const TESTIMONIALS = [
  { name: "Aisha K.",    role: "Medical Student",       avatar: "AK", text: "BrainDeck's AI generated 20 cards from my anatomy notes in seconds. I went from failing to acing my exams!" },
  { name: "James O.",    role: "Software Engineer",     avatar: "JO", text: "I use it to study for certifications. The quiz timer mode pushes me to think faster." },
  { name: "Priya M.",    role: "Law Student",           avatar: "PM", text: "The course feature lets me group all my case law decks together. Game changer for revision." },
  { name: "Liam T.",     role: "High School Student",   avatar: "LT", text: "My grades went from C's to A's in one semester. The streak system keeps me consistent." },
  { name: "Sofia R.",    role: "University Student",    avatar: "SR", text: "I uploaded my lecture PDF and got 15 flashcards instantly. I can't believe this is free." },
  { name: "Daniel N.",   role: "Data Scientist",        avatar: "DN", text: "Perfect for learning new concepts. The AI tutor explains things better than my professors!" },
  { name: "Yemi A.",     role: "Pharmacy Student",      avatar: "YA", text: "The progress charts show exactly which topics need more work. Very data-driven and satisfying." },
  { name: "Chloe W.",    role: "Language Learner",      avatar: "CW", text: "I create vocabulary decks for French. The spaced repetition style makes words stick." },
];

const FEATURES = [
  { icon: BookOpen,      color: "purple", title: "Smart Flashcards",    desc: "Create beautiful decks with front/back cards. Study with our flip card system inspired by spaced repetition." },
  { icon: ClipboardList, color: "indigo", title: "Adaptive Quizzes",    desc: "Auto-generated quizzes from your cards. Multiple choice, true/false, timed or untimed — you choose." },
  { icon: Sparkles,      color: "pink",   title: "AI Card Generation",  desc: "Paste notes or upload a PDF — AI generates flashcards in seconds. Save hours of manual work." },
  { icon: Brain,         color: "purple", title: "AI Tutor Chat",       desc: "Ask your personal AI tutor anything. Get concept explanations, quizzes, and custom study plans." },
  { icon: BarChart2,     color: "green",  title: "Progress Tracking",   desc: "Charts, streaks, subject breakdowns. Know exactly what you've mastered and what needs more work." },
  { icon: GraduationCap,color: "indigo",  title: "Courses",             desc: "Group decks into full courses. Study entire subjects in sequence and track course-level mastery." },
];

const STEPS = [
  { num: "01", title: "Create a Deck",      desc: "Name your deck, pick a subject and color. Organize your study material your way." },
  { num: "02", title: "Add Flashcards",     desc: "Type cards manually or let AI generate them from your notes, textbooks, or PDFs." },
  { num: "03", title: "Study & Quiz",       desc: "Flip through cards at your own pace, then take a timed quiz to test retention." },
  { num: "04", title: "Track Your Growth",  desc: "Watch your scores climb with progress charts, streaks, XP, and achievements." },
];

const FREE_FEATURES = [
  "Up to 5 decks",
  "Up to 30 cards per deck",
  "Up to 3 courses",
  "5 AI credits (one-time)",
  "Basic quiz (max 20 questions)",
  "Progress tracking",
];

const PRO_FEATURES = [
  "Unlimited decks & cards",
  "Unlimited courses",
  "50 AI credits per month",
  "AI Tutor chat",
  "Unlimited quiz questions",
  "Full progress analytics",
  "Achievements & XP system",
  "Priority support",
];

const STATS = [
  { icon: Users,    value: "10K+", label: "Students" },
  { icon: BookOpen, value: "50K+", label: "Decks Created" },
  { icon: Star,     value: "4.9",  label: "Avg Rating" },
  { icon: Target,   value: "94%",  label: "Pass Rate" },
];

const colorMap = {
  purple: { bg: "rgba(168,85,247,0.12)",  border: "rgba(168,85,247,0.25)", icon: "var(--purple-light)"  },
  indigo: { bg: "rgba(99,102,241,0.12)",   border: "rgba(99,102,241,0.25)",  icon: "var(--indigo-accent)" },
  pink:   { bg: "rgba(232,121,249,0.12)",  border: "rgba(232,121,249,0.25)", icon: "var(--pink-accent)"  },
  green:  { bg: "rgba(52,211,153,0.12)",   border: "rgba(52,211,153,0.25)",  icon: "var(--success)"      },
};

// Duplicate for infinite loop
const DOUBLED_TESTIMONIALS = [...TESTIMONIALS, ...TESTIMONIALS];

export default function Landing() {
  const { currentUser } = useAuth();
  const navigate        = useNavigate();

  useEffect(() => {
    if (currentUser) navigate("/dashboard", { replace: true });
  }, [currentUser, navigate]);

  return (
    <div className={styles.page}>

      {/* ── NAVBAR ── */}
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <Link to="/" className={styles.navLogo}>
            <div className={styles.navLogoIcon}>
              <Brain size={20} color="white" />
            </div>
            <span>Brain<span className="gradient-text">Deck</span></span>
          </Link>

          <nav className={styles.navLinks}>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#testimonials">Reviews</a>
            <a href="#pricing">Pricing</a>
          </nav>

          <div className={styles.navActions}>
            <Link to="/login" className={styles.navLogin}>Sign In</Link>
            <Link to="/signup" className={`btn-primary ${styles.navCta}`}>
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroOrb1} />
        <div className={styles.heroOrb2} />
        <div className={styles.heroOrb3} />

        <div className={styles.heroInner}>
          <motion.div
            className={styles.heroBadge}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles size={14} />
            <span>AI-Powered Learning Platform</span>
          </motion.div>

          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Study Smarter,<br />
            <span className="gradient-text">Not Harder</span>
          </motion.h1>

          <motion.p
            className={styles.heroSub}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Create flashcard decks, take AI-generated quizzes, and chat with your
            personal AI tutor. BrainDeck makes learning faster, smarter, and more fun.
          </motion.p>

          <motion.div
            className={styles.heroCtas}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link to="/signup" className={`btn-primary ${styles.heroCtaPrimary}`}>
              <span>Start Learning Free</span>
              <ChevronRight size={18} />
            </Link>
            <Link to="/login" className={`btn-secondary ${styles.heroCtaSecondary}`}>
              Sign In
            </Link>
          </motion.div>

          <motion.p
            className={styles.heroNote}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Free forever · No credit card required
          </motion.p>

          {/* Stats */}
          <motion.div
            className={styles.statsRow}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className={styles.statItem}>
                <Icon size={16} className={styles.statIcon} />
                <span className={styles.statValue}>{value}</span>
                <span className={styles.statLabel}>{label}</span>
              </div>
            ))}
          </motion.div>

          {/* Hero app mockup */}
          <motion.div
            className={styles.heroMockup}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7 }}
          >
            {/* Sidebar mockup */}
            <div className={styles.mockupSidebar}>
              <div className={styles.mockupSidebarLogo}>
                <Brain size={14} color="white" />
                <span>BrainDeck</span>
              </div>
              {["Dashboard","My Decks","Quizzes","Progress","AI Tutor"].map((item, i) => (
                <div key={item} className={`${styles.mockupSidebarItem} ${i === 1 ? styles.mockupSidebarActive : ""}`}>
                  {item}
                </div>
              ))}
            </div>

            {/* Main content mockup */}
            <div className={styles.mockupMain}>
              <div className={styles.mockupTopbar}>
                <span className={styles.mockupPageTitle}>My Decks</span>
                <div className={styles.mockupActions}>
                  <div className={styles.mockupCreditBadge}>✦ 5 credits</div>
                  <div className={styles.mockupAvatar}>CJ</div>
                </div>
              </div>

              <div className={styles.mockupCards}>
                {[
                  { title: "Biology Ch. 3", subject: "Science",  cards: 24, color: "#a855f7" },
                  { title: "World History", subject: "History",  cards: 18, color: "#6366f1" },
                  { title: "Calculus",      subject: "Math",     cards: 32, color: "#e879f9" },
                ].map(({ title, subject, cards, color }) => (
                  <div key={title} className={styles.mockupDeckCard}>
                    <div className={styles.mockupDeckStrip} style={{ background: color }} />
                    <div className={styles.mockupDeckIcon} style={{ background: `${color}22`, color }}>
                      <BookOpen size={12} />
                    </div>
                    <div>
                      <p className={styles.mockupDeckSubject}>{subject}</p>
                      <p className={styles.mockupDeckTitle}>{title}</p>
                      <p className={styles.mockupDeckCount}>{cards} cards</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI badge */}
              <div className={styles.mockupAiBadge}>
                <Sparkles size={12} />
                AI generated 12 cards from your PDF in 3 seconds
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={styles.section} id="features">
        <div className={styles.sectionInner}>
          <motion.div className={styles.sectionHeader} {...fadeUp(0)}>
            <div className={styles.sectionBadge}><Zap size={14} /> Features</div>
            <h2 className={styles.sectionTitle}>
              Everything you need to <span className="gradient-text">ace your studies</span>
            </h2>
            <p className={styles.sectionSub}>
              From flashcards to AI tutoring — all the tools you need in one beautiful platform.
            </p>
          </motion.div>

          <div className={styles.featuresGrid}>
            {FEATURES.map(({ icon: Icon, color, title, desc }, i) => {
              const c = colorMap[color];
              return (
                <motion.div
                  key={title}
                  className={styles.featureCard}
                  {...fadeUp(i * 0.08)}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <div className={styles.featureIcon} style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                    <Icon size={22} style={{ color: c.icon }} />
                  </div>
                  <h3 className={styles.featureTitle}>{title}</h3>
                  <p className={styles.featureDesc}>{desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SHOWCASE — AI Generation ── */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <div className={styles.showcase}>
            <motion.div className={styles.showcaseContent} {...fadeUp(0)}>
              <div className={styles.sectionBadge}><Sparkles size={14} /> AI-Powered</div>
              <h2 className={styles.showcaseTitle}>
                Turn your notes into<br /><span className="gradient-text">flashcards instantly</span>
              </h2>
              <p className={styles.showcaseDesc}>
                Upload a PDF, paste your lecture notes, or drop in any study material.
                Our AI reads it and generates clear, concise flashcards in seconds.
                No more hours of manual card creation.
              </p>
              <div className={styles.showcasePoints}>
                {["Supports PDF, images, and pasted text", "Generates 5–20 cards per session", "Review and select which cards to keep", "Uses 1 AI credit per generation"].map((p) => (
                  <div key={p} className={styles.showcasePoint}>
                    <div className={styles.showcasePointIcon}><Check size={12} /></div>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div className={styles.showcasePanel} {...fadeUp(0.15)}>
              <div className={styles.mockupHeader}>
                <div className={styles.mockupDot} style={{ background: "#ff5f57" }} />
                <div className={styles.mockupDot} style={{ background: "#febc2e" }} />
                <div className={styles.mockupDot} style={{ background: "#28c840" }} />
                <span className={styles.mockupTitle}>AI Card Generator</span>
              </div>
              <div className={styles.aiUploadBox}>
                <Sparkles size={22} style={{ color: "var(--purple-light)" }} />
                <p className={styles.aiUploadTitle}>Paste your study material</p>
                <div className={styles.aiUploadText}>
                  "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water..."
                </div>
              </div>
              <div className={styles.aiGenerating}>
                <Sparkles size={14} style={{ color: "var(--purple-light)" }} />
                <span>AI generated 8 cards</span>
              </div>
              {[
                { front: "What is photosynthesis?", back: "Process converting sunlight into food" },
                { front: "What do plants need for photosynthesis?", back: "Sunlight, CO₂ and water" },
              ].map((c, i) => (
                <div key={i} className={styles.aiPreviewCard}>
                  <div className={styles.aiCardSide}>
                    <span className={styles.aiCardLabel}>Front</span>
                    <p>{c.front}</p>
                  </div>
                  <div className={styles.aiCardDivider} />
                  <div className={styles.aiCardSide}>
                    <span className={styles.aiCardLabel}>Back</span>
                    <p>{c.back}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SHOWCASE — Quiz System ── */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={`${styles.showcase} ${styles.showcaseReverse}`}>
            <motion.div className={styles.showcaseContent} {...fadeUp(0)}>
              <div className={styles.sectionBadge}><ClipboardList size={14} /> Quiz System</div>
              <h2 className={styles.showcaseTitle}>
                Test yourself with<br /><span className="gradient-text">smart quizzes</span>
              </h2>
              <p className={styles.showcaseDesc}>
                Auto-generated quizzes from your flashcards. Choose multiple decks,
                set a timer, pick question types — then get instant feedback on every answer.
              </p>
              <div className={styles.showcasePoints}>
                {["Multiple choice and true/false questions", "Set timers from 1 min to 2 hours", "Select from multiple decks at once", "Full answer review after submission"].map((p) => (
                  <div key={p} className={styles.showcasePoint}>
                    <div className={styles.showcasePointIcon}><Check size={12} /></div>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div className={styles.showcasePanel} {...fadeUp(0.15)}>
              <div className={styles.mockupHeader}>
                <div className={styles.mockupDot} style={{ background: "#ff5f57" }} />
                <div className={styles.mockupDot} style={{ background: "#febc2e" }} />
                <div className={styles.mockupDot} style={{ background: "#28c840" }} />
                <span className={styles.mockupTitle}>Quiz Session</span>
              </div>
              <div className={styles.quizMockupTop}>
                <span className={styles.quizMockupTimer}>⏱ 4:32</span>
                <span className={styles.quizMockupProgress}>3 / 10 answered</span>
              </div>
              <div className={styles.quizMockupQuestion}>
                What organelle is responsible for producing ATP in cells?
              </div>
              <div className={styles.quizMockupOptions}>
                {[
                  { text: "Nucleus",        correct: false, chosen: false },
                  { text: "Mitochondria",   correct: true,  chosen: true  },
                  { text: "Ribosome",       correct: false, chosen: false },
                  { text: "Cell membrane",  correct: false, chosen: false },
                ].map(({ text, correct, chosen }) => (
                  <div
                    key={text}
                    className={`${styles.quizMockupOption}
                      ${chosen && correct  ? styles.quizOptionCorrect : ""}
                      ${chosen && !correct ? styles.quizOptionWrong   : ""}
                    `}
                  >
                    <span className={`${styles.quizOptionBullet} ${chosen ? styles.quizOptionBulletChosen : ""}`} />
                    {text}
                    {chosen && correct && <Check size={14} style={{ color: "var(--success)", marginLeft: "auto" }} />}
                  </div>
                ))}
              </div>
              <div className={styles.quizMockupFeedback}>
                ✅ Correct! Mitochondria are the powerhouse of the cell.
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS (sliding) ── */}
      <section className={styles.sliderSection} id="testimonials">
        <div className={styles.sectionHeader} style={{ marginBottom: "36px" }}>
          <div className={styles.sectionBadge}><Star size={14} /> Reviews</div>
          <h2 className={styles.sectionTitle}>
            Loved by <span className="gradient-text">students worldwide</span>
          </h2>
        </div>

        <div className={styles.sliderTrack}>
          {DOUBLED_TESTIMONIALS.map((t, i) => (
            <div key={i} className={styles.testimonialCard}>
              <div className={styles.testimonialStars}>
                {[...Array(5)].map((_, s) => (
                  <Star key={s} size={13} className={styles.starIcon} fill="#fbbf24" />
                ))}
              </div>
              <p className={styles.testimonialText}>"{t.text}"</p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.testimonialAvatar}>{t.avatar}</div>
                <div>
                  <p className={styles.testimonialName}>{t.name}</p>
                  <p className={styles.testimonialRole}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className={`${styles.section} ${styles.sectionAlt}`} id="how-it-works">
        <div className={styles.sectionInner}>
          <motion.div className={styles.sectionHeader} {...fadeUp(0)}>
            <div className={styles.sectionBadge}><Target size={14} /> How it Works</div>
            <h2 className={styles.sectionTitle}>
              Up and running in <span className="gradient-text">4 simple steps</span>
            </h2>
          </motion.div>

          <div className={styles.stepsGrid}>
            {STEPS.map(({ num, title, desc }, i) => (
              <motion.div key={num} className={styles.stepCard} {...fadeUp(i * 0.1)}>
                <div className={styles.stepNum}>{num}</div>
                <h3 className={styles.stepTitle}>{title}</h3>
                <p className={styles.stepDesc}>{desc}</p>
                {i < STEPS.length - 1 && (
                  <div className={styles.stepArrow}><ArrowRight size={18} /></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className={styles.section} id="pricing">
        <div className={styles.sectionInner}>
          <motion.div className={styles.sectionHeader} {...fadeUp(0)}>
            <div className={styles.sectionBadge}><Crown size={14} /> Pricing</div>
            <h2 className={styles.sectionTitle}>
              Simple, <span className="gradient-text">transparent pricing</span>
            </h2>
            <p className={styles.sectionSub}>
              Start free. Upgrade when you're ready. No hidden fees, cancel anytime.
            </p>
          </motion.div>

          <div className={styles.pricingGrid}>
            {/* Free */}
            <motion.div className={styles.pricingCard} {...fadeUp(0.1)}>
              <div className={styles.pricingHeader}>
                <p className={styles.pricingName}>Free</p>
                <div className={styles.pricingPrice}>$0<span>/month</span></div>
                <p className={styles.pricingDesc}>Perfect for getting started</p>
              </div>
              <ul className={styles.pricingFeatures}>
                {FREE_FEATURES.map((f) => (
                  <li key={f} className={styles.pricingFeature}>
                    <Check size={15} className={styles.checkIcon} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup" className={`btn-secondary ${styles.pricingCta}`}>
                Get Started Free
              </Link>
            </motion.div>

            {/* Pro */}
            <motion.div className={`${styles.pricingCard} ${styles.pricingCardPro}`} {...fadeUp(0.2)}>
              <div className={styles.proBadge}><Sparkles size={12} /> Most Popular</div>
              <div className={styles.pricingHeader}>
                <p className={styles.pricingName} style={{ color: "var(--purple-light)" }}>Pro</p>
                <div className={styles.pricingPrice} style={{ color: "var(--purple-light)" }}>$6<span>/month</span></div>
                <p className={styles.pricingDesc}>For serious learners</p>
              </div>
              <ul className={styles.pricingFeatures}>
                {PRO_FEATURES.map((f) => (
                  <li key={f} className={styles.pricingFeature}>
                    <Check size={15} className={styles.checkIconPro} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup" className={`btn-primary ${styles.pricingCta}`}>
                <Crown size={15} /><span>Start Pro — $6/mo</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaBannerInner}>
          <motion.div
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}
            {...fadeUp(0)}
          >
            <div className={styles.ctaIcon}>
              <Brain size={32} color="white" />
            </div>
            <h2 className={styles.ctaTitle}>Ready to start learning smarter?</h2>
            <p className={styles.ctaSub}>
              Join thousands of students already using BrainDeck to study better and score higher.
            </p>
            <Link to="/signup" className={`btn-primary ${styles.ctaBtn}`}>
              <span>Create Your Free Account</span>
              <ChevronRight size={18} />
            </Link>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Free forever · No credit card · Takes 30 seconds
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>
            <div className={styles.footerLogoIcon}><Brain size={18} color="white" /></div>
            <span className={styles.footerLogoText}>Brain<span className="gradient-text">Deck</span></span>
          </div>
          <p className={styles.footerTagline}>Study · Quiz · Grow</p>
          <div className={styles.footerLinks}>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#testimonials">Reviews</a>
            <Link to="/login">Sign In</Link>
            <Link to="/signup">Sign Up</Link>
          </div>
          <p className={styles.footerCopy}>
            © {new Date().getFullYear()} BrainDeck. Built with ❤️ for learners everywhere.
          </p>
        </div>
      </footer>
    </div>
  );
}
