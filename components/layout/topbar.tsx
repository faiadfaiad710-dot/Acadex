"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, CalendarDays, Home, Languages, Menu, MoonStar, Users } from "lucide-react";
import { motion } from "framer-motion";
import { THEMES } from "@/lib/constants";
import { signOutAction } from "@/lib/actions/auth";
import { useAppConfig } from "@/providers/app-providers";
import { cn } from "@/lib/utils";

const capsuleLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/teachers", label: "Teacher", icon: Users },
  { href: "/subjects", label: "Subject", icon: BookOpen },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/notices", label: "Notice", icon: Bell }
];

export function Topbar({
  title,
  subtitle,
  onMenuClick
}: {
  title: string;
  subtitle: string;
  onMenuClick: () => void;
}) {
  const { dictionary, language, setLanguage, theme, setTheme } = useAppConfig();
  const pathname = usePathname();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card relative rounded-[28px] border border-border/70 p-4 shadow-card sm:p-5"
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="flex items-start gap-3">
          <button
            type="button"
            className="rounded-2xl border border-border bg-card p-3 text-text transition hover:border-accent hover:text-accent"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </button>
          <div>
            <p className="brand-gradient brand-script text-4xl font-black leading-none">Acadex</p>
            <h1 className="font-heading text-xl font-bold text-text sm:text-2xl">{title}</h1>
            <p className="text-sm text-subtle">{subtitle}</p>
          </div>
        </div>

        <div className="hidden justify-center lg:flex">
          <nav className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-card/80 p-1 shadow-sm">
            {capsuleLinks.map((item) => {
              const active = pathname === item.href.split("#")[0];
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition",
                    active ? "bg-accent text-white" : "text-subtle hover:bg-muted hover:text-text"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2">
            <Languages className="size-4 text-subtle" />
            <button className={`text-sm ${language === "en" ? "font-bold text-text" : "text-subtle"}`} onClick={() => setLanguage("en")}>
              {dictionary.english}
            </button>
            <span className="text-subtle">/</span>
            <button className={`text-sm ${language === "bn" ? "font-bold text-text" : "text-subtle"}`} onClick={() => setLanguage("bn")}>
              {dictionary.bangla}
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2">
            <MoonStar className="size-4 text-subtle" />
            <select
              className="bg-transparent text-sm text-text outline-none"
              value={theme}
              onChange={(event) => setTheme(event.target.value as keyof typeof THEMES)}
            >
              {Object.entries(THEMES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>
          <form action={signOutAction}>
            <button className="rounded-2xl bg-text px-4 py-2 text-sm font-medium text-base transition hover:opacity-90">
              {dictionary.logout}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
