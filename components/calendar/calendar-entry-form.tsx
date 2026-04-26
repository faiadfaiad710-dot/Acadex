"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Subject } from "@/lib/types";

function SubmitButton({ kind }: { kind: "exam" | "event" }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="w-full rounded-2xl bg-accent px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Saving..." : kind === "event" ? "Save event" : "Save exam"}
    </button>
  );
}

export function CalendarEntryForm({
  subjects,
  action
}: {
  subjects: Subject[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [kind, setKind] = useState<"exam" | "event">("exam");
  const titlePlaceholder = useMemo(() => {
    return kind === "event" ? "Event title" : "Exam title";
  }, [kind]);

  return (
    <form action={action} className="mt-6 space-y-4">
      <select
        name="kind"
        value={kind}
        onChange={(event) => setKind(event.target.value === "event" ? "event" : "exam")}
        className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent"
      >
        <option value="exam">Exam</option>
        <option value="event">Event</option>
      </select>
      <input
        name="title"
        required
        placeholder={titlePlaceholder}
        className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent"
      />
      <select
        name="subjectId"
        required={kind === "exam"}
        disabled={kind === "event"}
        className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">{kind === "event" ? "General event (no subject)" : "Select subject for exam"}</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name} ({subject.code})
          </option>
        ))}
      </select>
      <input name="examDate" required type="date" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
      <input name="startTime" type="time" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
      <input name="room" placeholder="Room or hall" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
      <textarea name="note" rows={3} placeholder="Extra note" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
      <SubmitButton kind={kind} />
    </form>
  );
}
