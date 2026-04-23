"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, FileText, FlaskConical, Megaphone, Search, Users2 } from "lucide-react";

type SearchResult = {
  id: string;
  type: "file" | "teacher" | "notice" | "lab" | "subject";
  title: string;
  subtitle?: string;
  href: string;
};

const icons = {
  file: FileText,
  teacher: Users2,
  notice: Megaphone,
  lab: FlaskConical,
  subject: BookOpen
};

export function SidebarSearch({ onNavigate }: { onNavigate?: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

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
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="mb-4">
      <label className="flex items-center gap-3 rounded-2xl border border-border bg-card/80 px-4 py-3">
        <Search className="size-4 text-subtle" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search files, teachers, notices, labs, subjects"
          className="w-full bg-transparent text-sm text-text outline-none placeholder:text-subtle"
        />
      </label>

      {query.trim() ? (
        <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-2xl bg-muted/50 p-2">
          {loading ? <p className="px-3 py-2 text-sm text-subtle">Searching...</p> : null}
          {!loading && results.length === 0 ? <p className="px-3 py-2 text-sm text-subtle">No results found.</p> : null}
          {results.map((result) => {
            const Icon = icons[result.type];
            return (
              <Link
                key={`${result.type}-${result.id}`}
                href={result.href}
                onClick={onNavigate}
                className="flex items-start gap-3 rounded-2xl bg-card px-3 py-3 text-sm transition hover:border-accent hover:bg-white/80"
              >
                <div className="rounded-xl bg-accentSoft p-2 text-accent">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-text">{result.title}</p>
                  <p className="truncate text-xs text-subtle">{result.subtitle || result.type}</p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
