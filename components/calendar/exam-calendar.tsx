import { ExamEvent } from "@/lib/types";
import { Panel } from "@/components/ui/panel";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function sameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function ExamCalendar({ exams }: { exams: ExamEvent[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const monthLabel = new Intl.DateTimeFormat("en-BD", { month: "long", year: "numeric" }).format(today);
  const leadingBlanks = Array.from({ length: firstDay.getDay() });
  const days = Array.from({ length: lastDay.getDate() }, (_, index) => new Date(year, month, index + 1));

  return (
    <Panel>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-subtle">Exam calendar</p>
          <h3 className="font-heading text-2xl font-bold text-text">{monthLabel}</h3>
        </div>
        <p className="text-sm text-subtle">Admin-added exam dates appear inside each day.</p>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div key={day} className="rounded-2xl bg-muted px-2 py-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-subtle">
            {day}
          </div>
        ))}
        {leadingBlanks.map((_, index) => (
          <div key={`blank-${index}`} className="min-h-24 rounded-2xl border border-border/60 bg-muted/30" />
        ))}
        {days.map((day) => {
          const dayExams = exams.filter((exam) => sameDate(new Date(exam.examDate), day));
          return (
            <div key={day.toISOString()} className="min-h-28 rounded-2xl border border-border bg-card p-3">
              <p className="text-sm font-bold text-text">{day.getDate()}</p>
              <div className="mt-2 space-y-2">
                {dayExams.map((exam) => (
                  <div key={exam.id} className="rounded-xl bg-accentSoft px-2 py-2 text-xs text-accent">
                    <p className="font-bold">{exam.title}</p>
                    <p>{exam.subjectName}</p>
                    {exam.startTime ? <p>{exam.startTime}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
