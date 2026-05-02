"use client";

import Link from "next/link";
import { Check, Palette, UserRoundCog } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { SURFACE_MODES, THEMES } from "@/lib/constants";
import { SurfaceMode, ThemeName } from "@/lib/types";
import { useAppConfig } from "@/providers/app-providers";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { surfaceMode, setSurfaceMode, theme, setTheme } = useAppConfig();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18 }}
      className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]"
    >
      <GlassCard className="p-5">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-white/10 p-3 text-text">
            <UserRoundCog className="size-5" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold text-text">Profile</h2>
            <p className="text-sm text-subtle">Password and account information are managed here.</p>
          </div>
        </div>
        <Link
          href="/profile"
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Open profile
        </Link>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-white/10 p-3 text-text">
            <Palette className="size-5" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold text-text">Theme</h2>
            <p className="text-sm text-subtle">Choose surface mode and all Acadex accent themes.</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-subtle">Surface</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(Object.entries(SURFACE_MODES) as Array<[SurfaceMode, { label: string }]>).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSurfaceMode(key)}
                className={cn(
                  "flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition hover:shadow-lg",
                  surfaceMode === key ? "border-accent bg-accent text-white" : "border-white/20 bg-white/10 text-text hover:bg-white/20"
                )}
              >
                {value.label}
                {surfaceMode === key ? <Check className="size-4" /> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-subtle">Accent themes</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Object.entries(THEMES).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTheme(key as ThemeName)}
                className={cn(
                  "group flex min-h-24 flex-col justify-between rounded-2xl border p-4 text-left transition hover:shadow-lg",
                  theme === key ? "border-accent bg-accent text-white" : "border-white/20 bg-white/10 text-text hover:bg-white/20"
                )}
              >
                <span className="text-sm font-semibold">{value.label}</span>
                <span className="mt-4 flex gap-2">
                  {Object.entries(value.colors)
                    .filter(([token]) => token.startsWith("--palette-") || token === "--color-accent")
                    .slice(0, 5)
                    .map(([token, color]) => (
                    <span
                      key={token}
                      className="size-5 rounded-full border border-white/30"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
