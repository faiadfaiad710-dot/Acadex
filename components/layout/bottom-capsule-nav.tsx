"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Home, Search, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchResult = {
  id: string;
  type: "file" | "teacher" | "notice" | "lab" | "subject";
  title: string;
  subtitle?: string;
  href: string;
};

const capsuleLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/subjects", label: "Subject", icon: BookOpen },
  { href: "/routine", label: "Routine", icon: Table2 },
  { href: "#search", label: "Search", icon: Search }
];

export function BottomCapsuleNav() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [searchOpen]);

  useEffect(() => {
    const updateKeyboardOffset = () => {
      const viewport = window.visualViewport;
      setWindowHeight(window.innerHeight);
      if (!viewport) {
        setKeyboardOffset(0);
        return;
      }
      const offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardOffset(offset);
    };

    updateKeyboardOffset();
    window.visualViewport?.addEventListener("resize", updateKeyboardOffset);
    window.visualViewport?.addEventListener("scroll", updateKeyboardOffset);
    window.addEventListener("resize", updateKeyboardOffset);
    return () => {
      window.visualViewport?.removeEventListener("resize", updateKeyboardOffset);
      window.visualViewport?.removeEventListener("scroll", updateKeyboardOffset);
      window.removeEventListener("resize", updateKeyboardOffset);
    };
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await res.json();
        setResults(Array.isArray(data.results) ? data.results : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 160);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const navBottom = Math.max(16, keyboardOffset + 16);
  const searchBottom = Math.max(92, keyboardOffset + 88);
  const searchPanelMaxHeight = Math.max(180, (windowHeight || 720) - searchBottom - 14);
  const searchResultsMaxHeight = Math.max(92, searchPanelMaxHeight - 82);

  return (
    <>
      <AnimatePresence>
        {searchOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close search"
              className="fixed inset-0 z-[68] bg-slate-950/60 backdrop-blur-xl lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="glass-card fixed left-4 right-4 z-[75] rounded-[28px] border border-border/70 p-3 shadow-card lg:hidden"
              style={{ bottom: searchBottom, maxHeight: searchPanelMaxHeight }}
            >
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-card/85 px-4 py-3">
                <Search className="size-4 text-subtle" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search files, teachers, notices..."
                  className="w-full bg-transparent text-sm text-text outline-none placeholder:text-subtle"
                />
                {query ? (
                  <button type="button" onClick={() => setQuery("")} className="text-xs font-bold text-subtle">
                    Clear
                  </button>
                ) : null}
              </label>

              {query.trim() ? (
                <div className="mt-3 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: searchResultsMaxHeight }}>
                  {loading ? <p className="rounded-2xl bg-card/70 px-3 py-2 text-sm text-subtle">Searching...</p> : null}
                  {!loading && results.length === 0 ? <p className="rounded-2xl bg-card/70 px-3 py-2 text-sm text-subtle">No result found.</p> : null}
                  {results.map((result) => (
                    <Link
                      key={`${result.type}-${result.id}`}
                      href={result.href}
                      onClick={() => setSearchOpen(false)}
                      className="block rounded-2xl border border-border bg-card/85 px-4 py-3 transition hover:border-accent/50"
                    >
                      <p className="truncate text-sm font-bold text-text">{result.title}</p>
                      <p className="mt-1 truncate text-xs text-subtle">{result.subtitle || result.type}</p>
                    </Link>
                  ))}
                </div>
              ) : null}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <nav
        className="fixed left-1/2 z-[70] flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 gap-1 overflow-x-auto rounded-full border border-border bg-card/95 p-1 shadow-card backdrop-blur lg:hidden"
        style={{ bottom: navBottom }}
      >
        {capsuleLinks.map((item) => {
          const isSearch = item.href === "#search";
          const active = isSearch ? searchOpen : pathname === item.href;
          const Icon = item.icon;
          const className = cn(
            "inline-flex items-center justify-center rounded-full p-3 text-xs font-bold transition sm:p-3.5",
            active ? "bg-accent text-white" : "text-subtle hover:bg-muted hover:text-text"
          );

          return isSearch ? (
            <button
              key={item.href}
              type="button"
              className={className}
              aria-label={item.label}
              title={item.label}
              onClick={() => setSearchOpen((value) => !value)}
            >
              <Icon className="size-5" />
            </button>
          ) : (
            <Link key={item.href} href={item.href} className={className} aria-label={item.label} title={item.label}>
              <Icon className="size-5" />
            </Link>
          );
        })}
      </nav>
    </>
  );
}
