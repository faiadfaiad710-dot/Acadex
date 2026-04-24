"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

declare global {
  interface Window {
    __acadexIntroToken?: string;
  }
}

export function LoginIntro() {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState<"acadex" | "name">("acadex");

  useEffect(() => {
    const token = window.sessionStorage.getItem("acadex-intro");
    if (!token || window.__acadexIntroToken === token) return;

    window.__acadexIntroToken = token;
    window.sessionStorage.removeItem("acadex-intro");
    setShow(true);
    setPhase("acadex");

    const nameTimer = window.setTimeout(() => setPhase("name"), 1000);
    const closeTimer = window.setTimeout(() => setShow(false), 2500);

    return () => {
      window.clearTimeout(nameTimer);
      window.clearTimeout(closeTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-base"
        >
          <div className="absolute inset-0 animated-aurora opacity-90" />
          <div className="relative text-center">
            <AnimatePresence mode="wait">
              {phase === "acadex" ? (
                <motion.h1
                  key="acadex"
                  initial={{ opacity: 0, scale: 0.94, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -12 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="brand-gradient brand-script text-6xl font-black tracking-tight sm:text-8xl"
                >
                  Acadex
                </motion.h1>
              ) : (
                <motion.h2
                  key="name"
                  initial={{ opacity: 0, y: 16, clipPath: "inset(0 100% 0 0)" }}
                  animate={{ opacity: 1, y: 0, clipPath: "inset(0 0% 0 0)" }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  className="brand-gradient brand-script text-3xl font-black tracking-[0.12em] sm:text-5xl"
                >
                  FAHIM MONTASIR
                </motion.h2>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
