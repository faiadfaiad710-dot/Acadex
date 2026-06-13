"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bot, Download, ExternalLink, Send, Sparkles } from "lucide-react";
import { AiSearchResult } from "@/lib/types";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  results?: AiSearchResult[];
};

const examples = [
  "Give me Pharmacology notes about antibiotics.",
  "Show all files from Physical Pharmacy.",
  "Amoxicillin lecture slides.",
  "ড্রাগ মেটাবলিজমের নোট দাও।"
];

function newId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ResultCard({ result }: { result: AiSearchResult }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-sm font-bold text-text">{result.title}</p>
          <p className="mt-1 text-xs text-subtle">
            {result.subject || "Acadex"} {result.teacher ? `- ${result.teacher}` : ""}
          </p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-subtle">
          {result.fileType || result.sourceType}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {result.openHref ? (
          <Link
            href={result.openHref}
            className="inline-flex items-center gap-2 rounded-2xl bg-accent px-3 py-2 text-xs font-bold text-white transition hover:opacity-90"
          >
            <ExternalLink className="size-3.5" />
            Preview/Open
          </Link>
        ) : null}
        {result.downloadHref ? (
          <a
            href={result.downloadHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-text transition hover:bg-white/20"
          >
            <Download className="size-3.5" />
            Download
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function AiAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Ask me for notes, slides, notices, teachers, or subject resources in English, Bangla, or mixed Bangla-English. I will search Acadex and rank the most relevant files."
    }
  ]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<"auto" | "en" | "bn">("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage(messageText?: string) {
    const content = (messageText || input).trim();
    if (!content || loading) return;

    setInput("");
    setError("");
    setLoading(true);

    const userMessage: ChatMessage = { id: newId(), role: "user", content };
    const assistantId = newId();
    const assistantMessage: ChatMessage = { id: assistantId, role: "assistant", content: "" };
    const nextMessages = [...messages, userMessage, assistantMessage];
    setMessages(nextMessages);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          language,
          history: messages
            .filter((item) => item.id !== "welcome")
            .slice(-6)
            .map((item) => ({ role: item.role, content: item.content }))
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("AI stream did not start.");

      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const read = await reader.read();
        done = read.done;
        buffer += decoder.decode(read.value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        lines.forEach((line) => {
          if (!line.trim()) return;
          const packet = JSON.parse(line) as {
            type?: "results" | "delta" | "done" | "error";
            results?: AiSearchResult[];
            text?: string;
            error?: string;
          };

          if (packet.type === "results") {
            setMessages((current) =>
              current.map((item) => (item.id === assistantId ? { ...item, results: packet.results || [] } : item))
            );
          }

          if (packet.type === "delta" && packet.text) {
            setMessages((current) =>
              current.map((item) => (item.id === assistantId ? { ...item, content: `${item.content}${packet.text}` } : item))
            );
          }

          if (packet.type === "error") {
            setError(packet.error || "AI answer failed.");
          }
        });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI request failed.");
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? { ...item, content: "I could not complete that AI request. Please check the AI settings and try again." }
            : item
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <GlassCard className="p-5">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-accent p-3 text-white shadow-lg">
            <Sparkles className="size-5" />
          </span>
          <div>
            <h2 className="font-heading text-2xl font-black text-text">Acadex AI</h2>
            <p className="text-sm text-subtle">Bilingual academic file discovery and study assistant.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-2">
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => void sendMessage(example)}
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-left text-sm font-semibold text-text transition hover:bg-white/20"
            >
              {example}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-subtle">
          <p className="font-bold text-text">What it searches</p>
          <p className="mt-2">Uploaded files, subject resources, notices, teachers, labs, subjects, announcements, and metadata.</p>
        </div>
      </GlassCard>

      <GlassCard className="flex min-h-[68vh] flex-col overflow-hidden p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-white/10 p-3 text-text">
              <Bot className="size-5" />
            </span>
            <div>
              <p className="font-heading text-lg font-bold text-text">Academic chat</p>
              <p className="text-xs text-subtle">Search first, explain second, never fake files.</p>
            </div>
          </div>
          <div className="flex rounded-2xl border border-white/15 bg-white/10 p-1 text-xs font-bold">
            {(["auto", "en", "bn"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLanguage(item)}
                className={cn(
                  "rounded-xl px-3 py-2 transition",
                  language === item ? "bg-accent text-white" : "text-subtle hover:bg-white/10 hover:text-text"
                )}
              >
                {item === "auto" ? "Auto" : item === "en" ? "English" : "Bangla"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto py-5 pr-1">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.16 }}
              className={cn("max-w-[92%] space-y-3", message.role === "user" ? "ml-auto" : "mr-auto")}
            >
              <div
                className={cn(
                  "whitespace-pre-wrap rounded-[24px] border px-4 py-3 text-sm leading-6 shadow-sm",
                  message.role === "user"
                    ? "border-accent/30 bg-accent text-white"
                    : "border-white/15 bg-white/10 text-text backdrop-blur-md"
                )}
              >
                {message.content || (loading && message.role === "assistant" ? "Thinking..." : "")}
              </div>
              {message.results?.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {message.results.map((result) => (
                    <ResultCard key={`${result.sourceType}-${result.id}`} result={result} />
                  ))}
                </div>
              ) : null}
            </motion.div>
          ))}
        </div>

        {error ? <p className="mb-3 rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{error}</p> : null}

        <form onSubmit={onSubmit} className="flex items-end gap-2 rounded-[26px] border border-white/15 bg-white/10 p-2 backdrop-blur-md">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask Acadex AI in English, Bangla, or mixed language..."
            rows={1}
            className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border-0 bg-transparent px-3 py-3 text-sm text-text outline-none placeholder:text-subtle"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex size-12 items-center justify-center rounded-2xl bg-accent text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="size-5" />
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
