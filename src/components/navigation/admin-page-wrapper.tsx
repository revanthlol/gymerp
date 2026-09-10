"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface AdminPageWrapperProps {
  children: ReactNode;
}

const pageVariants = {
  initial: { opacity: 0, y: 10, scale: 0.985, filter: "blur(4px)" },
  in:      { opacity: 1, y: 0,  scale: 1,     filter: "blur(0px)" },
  out:     { opacity: 0, y: -8, scale: 0.985, filter: "blur(4px)" },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pageTransition: any = {
  type: "tween",
  ease: "circOut",
  duration: 0.35,
};

export function AdminPageWrapper({ children }: AdminPageWrapperProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
