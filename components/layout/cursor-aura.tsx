"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function CursorAura() {
  const reduceMotion = useReducedMotion();
  const [position, setPosition] = useState({ x: -200, y: -200 });

  useEffect(() => {
    if (reduceMotion) return;

    const handleMove = (event: MouseEvent) => {
      setPosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, [reduceMotion]);

  if (reduceMotion) return null;

  return (
    <motion.div
      animate={{
        x: position.x - 160,
        y: position.y - 160
      }}
      transition={{ type: "spring", damping: 28, stiffness: 180, mass: 0.35 }}
      className="pointer-events-none fixed left-0 top-0 z-[5] hidden h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(90,160,255,0.16)_0%,rgba(90,160,255,0.08)_28%,rgba(255,255,255,0)_70%)] blur-2xl lg:block"
    />
  );
}
