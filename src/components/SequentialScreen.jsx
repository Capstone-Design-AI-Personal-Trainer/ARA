import React from "react";
import { motion } from "framer-motion";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.12,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function SequentialScreen({ className = "", children }) {
  const nodes = React.Children.toArray(children);

  return (
    <motion.section className={className} variants={container} initial="hidden" animate="show">
      {nodes.map((child, idx) => (
        <motion.div key={child.key ?? idx} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.section>
  );
}
