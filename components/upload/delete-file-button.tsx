"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface DeleteFileButtonProps {
  fileId: string;
}

export function DeleteFileButton({ fileId }: DeleteFileButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={isPending}
        className="rounded-xl bg-danger px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        onClick={() => {
          if (!window.confirm("Delete this file from the website?")) {
            return;
          }

          setMessage("");

          startTransition(async () => {
            const response = await fetch(`/api/files?id=${encodeURIComponent(fileId)}`, {
              method: "DELETE"
            });

            const data = (await response.json().catch(() => null)) as { error?: string } | null;

            if (!response.ok) {
              setMessage(data?.error || "Delete failed.");
              return;
            }

            router.refresh();
          });
        }}
      >
        {isPending ? "Deleting..." : "Delete"}
      </button>
      {message ? <p className="text-xs text-danger">{message}</p> : null}
    </div>
  );
}
