"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Loading() {
  const [phase, setPhase] = useState<"acadex" | "name">("acadex");

  useEffect(() => {
    const timer = window.setTimeout(() => setPhase("name"), 1000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-base">
      <div className="absolute inset-0 animated-aurora opacity-80" />
      <div className="relative text-center">
        <AnimatePresence mode="wait">
          {phase === "acadex" ? (
            <motion.p
              key="acadex"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -12 }}
              transition={{ duration: 0.35 }}
              className="brand-gradient font-heading text-6xl font-black tracking-tight sm:text-8xl"
            >
              Acadex
            </motion.p>
          ) : (
            <motion.p
              key="name"
              initial={{ opacity: 0, y: 16, clipPath: "inset(0 100% 0 0)" }}
              animate={{ opacity: 1, y: 0, clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 0.55 }}
              className="brand-gradient font-heading text-3xl font-black uppercase tracking-[0.18em] sm:text-5xl"
            >
              FAHIM MONTASIR
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
