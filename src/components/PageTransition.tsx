"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
    scale: 0.985,
    filter: "blur(4px)",
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
  },
  out: {
    opacity: 0,
    y: -8,
    scale: 0.985,
    filter: "blur(4px)",
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pageTransition: any = {
  type: "tween",
  ease: "circOut",
  duration: 0.35,
};

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={className ?? "w-full h-full"}
    >
      {children}
    </motion.div>
  );
}
