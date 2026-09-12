"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SLIDES = [
  {
    src: "/gym-1.jpg",
    title: "Strength & Conditioning",
    subtitle: "High-performance platform facilities and equipment",
  },
  {
    src: "/gym-2.jpg",
    title: "Combat & Agility",
    subtitle: "Dedicated boxing suites and metabolic conditioning spaces",
  },
  {
    src: "/gym-3.jpg",
    title: "Precision Resistance",
    subtitle: "Calibrated free weight and dumbbell training zones",
  },
];

export function AuthImageSlideshow({
  tagline = "GymERP Operations",
  description = "Facility management, member check-ins, and performance tracking.",
}: {
  tagline?: string;
  description?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const currentSlide = SLIDES[currentIndex];

  return (
    <div className="relative hidden lg:block bg-[#090a0f] border-l border-zinc-900 overflow-hidden select-none">
      <AnimatePresence mode="sync">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <img
            src={currentSlide.src}
            alt={currentSlide.title}
            className="w-full h-full object-cover brightness-[0.72] contrast-[1.05]"
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark Vignette Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/25 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f]/40 via-transparent to-transparent pointer-events-none" />

      {/* Subtle Bottom Content & Indicators */}
      <div className="absolute bottom-10 left-10 right-10 z-10 flex items-end justify-between gap-4">
        <div className="space-y-1 max-w-md">
          <p className="text-sm font-medium text-zinc-200">
            {tagline} — {currentSlide.title}
          </p>
          <p className="text-xs text-zinc-400">
            {currentSlide.subtitle}
          </p>
        </div>

        {/* Minimalist Slide Indicator Dots */}
        <div className="flex items-center gap-1.5 pb-1">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? "w-6 bg-white"
                  : "w-1.5 bg-zinc-600 hover:bg-zinc-400"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
