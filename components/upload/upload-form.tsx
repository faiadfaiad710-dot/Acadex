"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface UploadFormProps {
  subjects: {
    id: string;
    name: string;
    code: string;
  }[];
}

export function UploadForm({ subjects }: UploadFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleUpload = async (formData: FormData) => {
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });

    const text = await res.text();
    let data:
      | {
          files?: Array<{
            id: string;
            url: string;
            publicId?: string;
            resourceType?: string;
            format?: string;
          }>;
          count?: number;
          error?: string;
        }
      | null = null;

    try {
      data = JSON.parse(text) as {
        files?: Array<{
          id: string;
          url: string;
          publicId?: string;
          resourceType?: string;
          format?: string;
        }>;
        count?: number;
        error?: string;
      };
    } catch {
      data = null;
    }

    if (!res.ok) {
      throw new Error(data?.error || text || "Upload failed");
    }

    return (data || {}) as {
      files?: Array<{
        id: string;
        url: string;
        publicId?: string;
        resourceType?: string;
        format?: string;
      }>;
      count?: number;
    };
  };

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("");
        const formData = new FormData(event.currentTarget);
        const title = String(formData.get("title") || "").trim();
        const subjectId = String(formData.get("subjectId") || "");
        const files = formData
          .getAll("files")
          .filter((item): item is File => item instanceof File && item.size > 0);
        const selectedSubject = subjects.find((subject) => subject.id === subjectId);

        if (!subjectId || !selectedSubject || !files.length) {
          setMessage("Please choose a subject and at least one file.");
          return;
        }

        startTransition(async () => {
          try {
            const uploadData = new FormData();
            uploadData.append("subjectId", subjectId);
            uploadData.append("subjectName", selectedSubject.name);
            if (title) {
              uploadData.append("title", title);
            }
            files.forEach((file) => uploadData.append("files", file));

            const result = await handleUpload(uploadData);

            setMessage(`${result.count || files.length} file(s) uploaded successfully.`);
            router.refresh();
            (event.currentTarget as HTMLFormElement).reset();
          } catch (error) {
            setMessage(error instanceof Error ? error.message : "Upload failed");
          }
        });
      }}
    >
      <input
        name="title"
        placeholder="Optional title prefix"
        className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent"
      />
      <select
        name="subjectId"
        required
        className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent"
        defaultValue=""
      >
        <option value="" disabled>
          Select subject
        </option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name} ({subject.code})
          </option>
        ))}
      </select>
      <input
        name="files"
        type="file"
        multiple
        required
        className="w-full rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-sm"
      />
      {message ? <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-subtle">{message}</p> : null}
      <button
        disabled={isPending}
        className="w-full rounded-2xl bg-accent px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Uploading..." : "Upload file"}
      </button>
    </form>
  );
}
