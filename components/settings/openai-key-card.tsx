"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

export function OpenAIKeyCard() {
  const [apiKey, setApiKey] = useState("");
  const [hasPersonalKey, setHasPersonalKey] = useState(false);
  const [hasWebsiteKey, setHasWebsiteKey] = useState(false);
  const [status, setStatus] = useState("Loading AI settings...");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/ai/settings")
      .then((response) => response.json())
      .then((data: { hasPersonalKey?: boolean; hasWebsiteKey?: boolean; error?: string }) => {
        if (!alive) return;
        setHasPersonalKey(Boolean(data.hasPersonalKey));
        setHasWebsiteKey(Boolean(data.hasWebsiteKey));
        setStatus(data.error || "AI settings loaded.");
      })
      .catch(() => {
        if (alive) setStatus("Could not load AI settings.");
      });

    return () => {
      alive = false;
    };
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!apiKey.trim()) return;
    setSaving(true);
    setStatus("Saving key...");
    try {
      const response = await fetch("/api/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey })
      });
      const data = (await response.json()) as { error?: string; hasPersonalKey?: boolean };
      if (!response.ok) throw new Error(data.error || "Could not save key.");
      setApiKey("");
      setHasPersonalKey(Boolean(data.hasPersonalKey));
      setStatus("Personal OpenAI key connected.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save key.");
    } finally {
      setSaving(false);
    }
  }

  async function clear() {
    setSaving(true);
    setStatus("Removing personal key...");
    try {
      const response = await fetch("/api/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear: true })
      });
      const data = (await response.json()) as { error?: string; hasPersonalKey?: boolean };
      if (!response.ok) throw new Error(data.error || "Could not remove key.");
      setHasPersonalKey(Boolean(data.hasPersonalKey));
      setStatus("Personal key removed. Website AI mode will be used.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not remove key.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-3">
        <span className="rounded-2xl bg-white/10 p-3 text-text">
          <KeyRound className="size-5" />
        </span>
        <div>
          <h2 className="font-heading text-xl font-semibold text-text">AI Account</h2>
          <p className="text-sm text-subtle">Use website AI mode, or connect your own OpenAI API key.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-subtle">Website key</p>
          <p className="mt-2 font-bold text-text">{hasWebsiteKey ? "Available" : "Not configured"}</p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-subtle">Personal key</p>
          <p className="mt-2 font-bold text-text">{hasPersonalKey ? "Connected" : "Not connected"}</p>
        </div>
      </div>

      <form onSubmit={save} className="mt-5 space-y-3">
        <input
          type="password"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder="OpenAI API key (starts with sk-...)"
          className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-text outline-none placeholder:text-subtle focus:ring-2 focus:ring-white/30"
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving || !apiKey.trim()}
            className="rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save API key
          </button>
          <button
            type="button"
            onClick={() => void clear()}
            disabled={saving || !hasPersonalKey}
            className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-text transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Remove personal key
          </button>
        </div>
      </form>

      <p className="mt-4 flex items-start gap-2 rounded-2xl border border-white/15 bg-white/10 p-4 text-xs leading-5 text-subtle">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-text" />
        ChatGPT account connection is future-ready. Today, Acadex uses an OpenAI API key directly, with your personal key taking priority over the website key.
      </p>
      <p className="mt-3 text-xs font-semibold text-subtle">{status}</p>
    </GlassCard>
  );
}
