"use client";

import { motion } from "framer-motion";
import React from "react";

interface MotionDivProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
}

export default function MotionDiv({
  children,
  className,
  delay = 0,
  duration = 0.35,
  y = 12,
}: MotionDivProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
