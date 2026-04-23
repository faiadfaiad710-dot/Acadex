import { CalendarDays } from "lucide-react";
import { Panel } from "@/components/ui/panel";

const DAYS = [
  { label: "Saturday", active: true },
  { label: "Sunday", active: true },
  { label: "Monday", active: true },
  { label: "Tuesday", active: true },
  { label: "Wednesday", active: true },
  { label: "Thursday", active: false },
  { label: "Friday", active: false }
];

export function WeeklyCalendar({ title }: { title: string }) {
  return (
    <Panel>
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-accentSoft p-3 text-accent">
          <CalendarDays className="size-5" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-semibold text-text">{title}</h3>
          <p className="text-sm text-subtle">Saturday to Wednesday active, Thursday and Friday off.</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {DAYS.map((day) => (
          <div
            key={day.label}
            className={`rounded-2xl border p-4 text-center ${
              day.active ? "border-accent/30 bg-accentSoft/70 text-text" : "border-border bg-muted/60 text-subtle"
            }`}
          >
            <p className="text-sm font-medium">{day.label}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em]">{day.active ? "Active" : "Off"}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
