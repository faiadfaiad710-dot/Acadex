"use client";

import { useFormStatus } from "react-dom";
import { Subject } from "@/lib/types";

const days = [
  ["saturday", "Saturday"],
  ["sunday", "Sunday"],
  ["monday", "Monday"],
  ["tuesday", "Tuesday"],
  ["wednesday", "Wednesday"],
  ["thursday", "Thursday"],
  ["friday", "Friday"]
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
      {pending ? "Saving..." : "Add class"}
    </button>
  );
}

export function RoutineForm({
  subjects,
  action
}: {
  subjects: Subject[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="mt-5 grid gap-3">
      <select name="subjectId" required className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent">
        <option value="">Select subject</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name} ({subject.code})
          </option>
        ))}
      </select>
      <select name="day" required className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent">
        {days.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="startTime" type="time" required className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
        <input name="endTime" type="time" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
      </div>
      <input name="room" placeholder="Room" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
      <input name="teacherName" placeholder="Teacher name" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
      <textarea name="note" rows={3} placeholder="Class note" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
      <SubmitButton />
    </form>
  );
}
