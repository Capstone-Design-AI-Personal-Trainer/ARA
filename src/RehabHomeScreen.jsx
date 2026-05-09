import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./RehabHomeScreen.css";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.2,
    },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

const heroGraphic = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
  },
};

const textReveal = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

const progressList = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.16,
      delayChildren: 0.15,
    },
  },
};

const ringItem = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const progressData = [
  { label: "Accuracy", value: 82 },
  { label: "Stability", value: 74 },
  { label: "Consistency", value: 91 },
];

function ProgressRing({ label, value, delay }) {
  const circumference = 2 * Math.PI * 44;
  const offset = circumference * (1 - value / 100);

  return (
    <motion.div className="rehab-ring-card" variants={ringItem}>
      <div className="rehab-ring-wrap">
        <svg viewBox="0 0 110 110" className="rehab-ring-svg" aria-hidden="true">
          <circle cx="55" cy="55" r="44" className="rehab-ring-bg" />
          <motion.circle
            cx="55"
            cy="55"
            r="44"
            className="rehab-ring-fg"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.3, delay, ease: [0.2, 1, 0.3, 1] }}
          />
        </svg>
        <div className="rehab-ring-value">{value}%</div>
      </div>
      <div className="rehab-ring-label">{label}</div>
    </motion.div>
  );
}

export default function RehabHomeScreen() {
  const navigate = useNavigate();

  return (
    <motion.main
      className="rehab-home"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div className="rehab-bg" variants={fadeIn} />

      <motion.section className="rehab-hero" variants={heroGraphic}>
        <motion.div
          className="wireframe-glow"
          animate={{
            scale: [1, 1.03, 1],
            opacity: [0.72, 0.95, 0.72],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="wireframe-body" aria-hidden="true">
          <span className="joint j1" />
          <span className="joint j2" />
          <span className="joint j3" />
          <span className="joint j4" />
          <span className="joint j5" />
          <span className="joint j6" />
          <span className="joint j7" />
          <span className="joint j8" />
          <span className="joint j9" />
        </div>
      </motion.section>

      <motion.header className="rehab-copy" variants={textReveal}>
        <p className="eyebrow">AI Rehabilitation Assistant · ARA</p>
        <h1>Ready for your daily recovery?</h1>
        <p className="sub">Your guided session is calibrated and ready</p>
      </motion.header>

      <motion.section className="rehab-progress" variants={progressList}>
        {progressData.map((item, idx) => (
          <ProgressRing
            key={item.label}
            label={item.label}
            value={item.value}
            delay={0.95 + idx * 0.18}
          />
        ))}
      </motion.section>

      <motion.button
        className="rehab-cta"
        variants={textReveal}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/exercise")}
        animate={{
          y: [0, -2, 0],
        }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
      >
        Start Today&apos;s Session
      </motion.button>
    </motion.main>
  );
}
