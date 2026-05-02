"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { markNotificationsSeenAction } from "@/lib/actions/auth";
import { Notice } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function NoticePopup({ notices }: { notices: Notice[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (notices.length) {
      const timer = window.setTimeout(() => setOpen(true), 450);
      return () => window.clearTimeout(timer);
    }
  }, [notices.length]);

  function closeAndMarkSeen() {
    setOpen(false);
    startTransition(async () => {
      await markNotificationsSeenAction().catch(() => undefined);
      window.dispatchEvent(new Event("acadex-notifications-seen"));
    });
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          className="fixed bottom-24 left-4 right-4 z-[90] mx-auto max-w-md rounded-3xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-2xl sm:bottom-6 sm:left-auto sm:right-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-accent p-3 text-white">
                <Bell className="size-5" />
              </span>
              <div>
                <p className="font-heading text-base font-semibold text-text">New notice</p>
                <p className="text-xs text-subtle">{notices.length} unseen notice update</p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeAndMarkSeen}
              className="rounded-2xl border border-border bg-card p-2 text-text"
              aria-label="Close notice popup"
              disabled={isPending}
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {notices.map((notice) => (
              <div key={notice.id} className="rounded-2xl border border-border bg-card p-3">
                <p className="line-clamp-2 text-sm font-medium text-text">{notice.text || notice.attachmentName || "Attachment-only notice"}</p>
                <p className="mt-1 text-xs text-subtle">{formatDate(notice.date)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-end gap-3 text-sm font-semibold">
            <button type="button" onClick={closeAndMarkSeen} className="text-subtle" disabled={isPending}>
              Mark seen
            </button>
            <Link href="/updates" onClick={closeAndMarkSeen} className="rounded-2xl bg-accent px-4 py-2 text-white">
              Open updates
            </Link>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
