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

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Upload failed");
    }

    return data as {
      url: string;
      publicId?: string;
      resourceType?: string;
      format?: string;
    };
  };

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("");
        const formData = new FormData(event.currentTarget);
        const title = String(formData.get("title") || "");
        const subjectId = String(formData.get("subjectId") || "");
        const file = formData.get("file") as File | null;
        const selectedSubject = subjects.find((subject) => subject.id === subjectId);

        if (!title || !subjectId || !selectedSubject || !file || file.size === 0) {
          setMessage("Please fill in all upload fields.");
          return;
        }

        startTransition(async () => {
          try {
            const uploadData = new FormData();
            uploadData.append("file", file);
            uploadData.append("title", title);
            uploadData.append("subjectId", subjectId);
            uploadData.append("subjectName", selectedSubject.name);

            await handleUpload(uploadData);

            setMessage("File uploaded successfully.");
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
        placeholder="File title"
        required
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
        name="file"
        type="file"
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
