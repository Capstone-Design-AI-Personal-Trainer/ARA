import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import araHomeMascot from "../../assets/home/ara-home-mascot.png";
import "./RehabHomeScreen.css";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

function HeartIcon() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path
        d="M14 23.2 5.3 15C.6 10.6 3.4 4 9.2 4c2.1 0 3.9 1.1 4.8 2.7C14.9 5.1 16.7 4 18.8 4c5.8 0 8.6 6.6 3.9 11L14 23.2Z"
        fill="#ff4f72"
      />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M3 17h6l2.5-7 5 14 3.5-10 2 3h7"
        fill="none"
        stroke="#72d7e2"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DumbbellIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <g fill="#338bff" transform="rotate(-45 16 16)">
        <rect x="12.5" y="13.5" width="7" height="5" rx="1.5" />
        <rect x="7" y="10" width="4" height="12" rx="1.5" />
        <rect x="21" y="10" width="4" height="12" rx="1.5" />
        <rect x="4.5" y="12.5" width="2.5" height="7" rx="1" />
        <rect x="25" y="12.5" width="2.5" height="7" rx="1" />
      </g>
    </svg>
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
      <motion.header className="rehab-copy" variants={reveal}>
        <p className="eyebrow">AI REHABILITATION ASSISTANT ARA</p>
        <h1>
          안녕하세요!
          <br />
          ARA가 오늘도
          <br />
          당신의 운동을 함께할게요
        </h1>
        <p className="sub">함께 꾸준히, 더 나은 회복을 위해 나아가요.</p>
      </motion.header>

      <motion.section className="rehab-mascot-stage" variants={reveal}>
        <div className="rehab-glow" aria-hidden="true" />

        <motion.div
          className="rehab-float-icon rehab-heart"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut" }}
        >
          <HeartIcon />
        </motion.div>

        <motion.div
          className="rehab-float-icon rehab-pulse"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <PulseIcon />
        </motion.div>

        <motion.div
          className="rehab-float-icon rehab-dumbbell"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <DumbbellIcon />
        </motion.div>

        <motion.div
          className="rehab-speech"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          오늘도
          <br />
          잘 부탁해요!
        </motion.div>

        <motion.img
          className="rehab-mascot"
          src={araHomeMascot}
          alt="두 팔을 벌려 인사하는 ARA 재활 도우미 캐릭터"
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.section>

      <motion.button
        className="rehab-cta"
        variants={reveal}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/exercise")}
      >
        운동 시작하기
      </motion.button>
    </motion.main>
  );
}
