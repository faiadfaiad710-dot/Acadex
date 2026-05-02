"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function NoticeForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      encType="multipart/form-data"
      className="mt-6 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("");

        const form = event.currentTarget;
        const formData = new FormData(form);
        const text = String(formData.get("text") || "").trim();
        const file = formData.get("file");
        const hasFile = file instanceof File && file.size > 0;

        if (!text && !hasFile) {
          setMessage("Write notice text or upload a file.");
          return;
        }

        startTransition(async () => {
          try {
            const response = await fetch("/api/notices", {
              method: "POST",
              credentials: "same-origin",
              body: formData
            });

            const body = await response.text();
            let data: { error?: string; success?: boolean } | null = null;

            try {
              data = JSON.parse(body) as { error?: string; success?: boolean };
            } catch {
              data = null;
            }

            if (!response.ok) {
              throw new Error(data?.error || body || "Notice publish failed");
            }

            setMessage("Notice published successfully.");
            form.reset();
            router.refresh();
          } catch (error) {
            setMessage(error instanceof Error ? error.message : "Notice publish failed");
          }
        });
      }}
    >
      <textarea
        name="text"
        placeholder="Notice text (optional if a file is uploaded)"
        rows={5}
        className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent"
      />
      <input name="file" type="file" className="w-full rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-sm" />
      {message ? <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-subtle">{message}</p> : null}
      <button
        disabled={isPending}
        className="w-full rounded-2xl bg-accent px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Publishing..." : "Publish notice"}
      </button>
    </form>
  );
}
