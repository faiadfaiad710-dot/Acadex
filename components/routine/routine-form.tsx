"use client";

import { useFormStatus } from "react-dom";
import { ClassRoutine, Subject, Teacher } from "@/lib/types";

const days = [
  ["saturday", "Saturday"],
  ["sunday", "Sunday"],
  ["monday", "Monday"],
  ["tuesday", "Tuesday"],
  ["wednesday", "Wednesday"],
  ["thursday", "Thursday"],
  ["friday", "Friday"]
] as const;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
      {pending ? "Saving..." : label}
    </button>
  );
}

export function RoutineForm({
  subjects,
  teachers,
  routine,
  compact = false,
  action
}: {
  subjects: Subject[];
  teachers: Teacher[];
  routine?: ClassRoutine;
  compact?: boolean;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className={compact ? "mt-4 grid gap-3" : "mt-5 grid gap-3"}>
      {routine?.id ? <input type="hidden" name="id" value={routine.id} /> : null}
      <select name="subjectId" required defaultValue={routine?.subjectId || ""} className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent">
        <option value="">Select subject</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name} ({subject.code})
          </option>
        ))}
      </select>
      <select name="day" required defaultValue={routine?.day || "saturday"} className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent">
        {days.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="startTime" type="time" required defaultValue={routine?.startTime || ""} className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
        <input name="endTime" type="time" defaultValue={routine?.endTime || ""} className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
      </div>
      <input name="room" placeholder="Room" defaultValue={routine?.room || ""} className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
      <select name="teacherId" defaultValue={routine?.teacherId || ""} className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent">
        <option value="">Select teacher</option>
        {teachers.map((teacher) => (
          <option key={teacher.id} value={teacher.id}>
            {teacher.name}
          </option>
        ))}
      </select>
      <input name="teacherName" placeholder="Teacher name if not listed" defaultValue={routine?.teacherName || ""} className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
      <textarea name="note" rows={compact ? 2 : 3} placeholder="Class note" defaultValue={routine?.note || ""} className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
      <SubmitButton label={routine?.id ? "Update class" : "Add class"} />
    </form>
  );
}
