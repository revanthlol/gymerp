"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useIsDesktop } from "@/hooks/useIsDesktop";

const DynamicMotionDiv = dynamic(() => import("./motion/MotionDiv"), {
  ssr: false,
  loading: () => null,
});

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
}

export function Reveal({
  children,
  className,
  delay = 0,
  duration = 0.35,
  y = 12,
}: RevealProps) {
  const isDesktop = useIsDesktop();

  if (!isDesktop) {
    return <div className={className}>{children}</div>;
  }

  return (
    <DynamicMotionDiv
      className={className}
      delay={delay}
      duration={duration}
      y={y}
    >
      {children}
    </DynamicMotionDiv>
  );
}
