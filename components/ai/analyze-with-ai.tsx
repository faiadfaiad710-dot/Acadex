"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Languages } from "lucide-react";
import { AiSourceType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AnalyzeWithAI({
  sourceType,
  sourceId,
  title
}: {
  sourceType?: AiSourceType;
  sourceId?: string;
  title: string;
}) {
  const [language, setLanguage] = useState<"auto" | "en" | "bn">("auto");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [error, setError] = useState("");

  if (!sourceType || !sourceId) return null;

  async function analyze() {
    const approved = window.confirm(
      "Analyze this file with Acadex AI? The file or its metadata may be sent to OpenAI using the configured API key."
    );
    if (!approved) return;

    setLoading(true);
    setError("");
    setAnalysis("");

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType, id: sourceId, language })
      });

      const data = (await response.json()) as { analysis?: string; error?: string };
      if (!response.ok) throw new Error(data.error || "AI analysis failed.");
      setAnalysis(data.analysis || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-white/15 bg-white/10 p-4 shadow-lg backdrop-blur-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-accent p-3 text-white">
            <BrainCircuit className="size-5" />
          </span>
          <div>
            <p className="font-heading text-base font-bold text-text">Analyze with AI</p>
            <p className="text-xs text-subtle">Summary, key concepts, viva questions, MCQs, and exam-focused points for {title}.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-subtle">
            <Languages className="size-3.5" />
            Language
          </span>
          {(["auto", "en", "bn"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLanguage(item)}
              className={cn(
                "rounded-2xl border px-3 py-2 text-xs font-bold transition",
                language === item ? "border-accent bg-accent text-white" : "border-white/15 bg-white/10 text-text hover:bg-white/20"
              )}
            >
              {item === "auto" ? "Auto" : item === "en" ? "English" : "Bangla"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void analyze()}
            disabled={loading}
            className="rounded-2xl bg-accent px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </div>

      {error ? <p className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{error}</p> : null}
      {analysis ? (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.18 }}
          className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/15 bg-white/10 p-4 text-sm leading-7 text-text"
        >
          {analysis}
        </motion.div>
      ) : null}
    </div>
  );
}
