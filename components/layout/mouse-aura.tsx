"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function MouseAura() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(pointer: fine)");
    if (!media.matches) return;

    const handleMove = (event: MouseEvent) => {
      setPosition({ x: event.clientX, y: event.clientY });
      setVisible(true);
    };

    const handleLeave = () => setVisible(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <motion.div
      aria-hidden="true"
      animate={{
        x: position.x - 140,
        y: position.y - 140,
        opacity: visible ? 1 : 0
      }}
      transition={{ type: "spring", stiffness: 85, damping: 18, mass: 0.8 }}
      className="pointer-events-none fixed left-0 top-0 z-[5] hidden h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.2)_0%,rgba(93,160,255,0.12)_28%,rgba(93,160,255,0.04)_52%,transparent_72%)] blur-2xl md:block"
    />
  );
}
