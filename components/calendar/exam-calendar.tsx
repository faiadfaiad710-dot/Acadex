"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ExamEvent } from "@/lib/types";
import { Panel } from "@/components/ui/panel";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function sameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function ExamCalendar({ exams }: { exams: ExamEvent[] }) {
  const today = new Date();
  const minYear = today.getFullYear() - 5;
  const maxYear = today.getFullYear() + 5;
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const monthLabel = `${monthNames[month]} ${year}`;
  const leadingBlanks = Array.from({ length: firstDay.getDay() });
  const days = Array.from({ length: lastDay.getDate() }, (_, index) => new Date(year, month, index + 1));

  const yearOptions = useMemo(() => Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index), [minYear, maxYear]);

  function stepMonth(direction: -1 | 1) {
    const next = new Date(year, month + direction, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  return (
    <Panel>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-subtle">Exam calendar</p>
            <h3 className="font-heading text-2xl font-bold text-text">{monthLabel}</h3>
          </div>
          <p className="text-sm text-subtle">Select any month and year from 5 years back to 5 years ahead.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => stepMonth(-1)} className="rounded-2xl border border-border bg-card p-3 text-text">
            <ChevronLeft className="size-4" />
          </button>
          <select value={month} onChange={(event) => setMonth(Number(event.target.value))} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent">
            {monthNames.map((name, index) => (
              <option key={name} value={index}>
                {name}
              </option>
            ))}
          </select>
          <select value={year} onChange={(event) => setYear(Number(event.target.value))} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent">
            {yearOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => stepMonth(1)} className="rounded-2xl border border-border bg-card p-3 text-text">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="grid min-w-[700px] grid-cols-7 gap-2 sm:min-w-[880px] sm:gap-3">
          {weekDays.map((day) => (
            <div key={day} className="rounded-2xl bg-muted px-2 py-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-subtle sm:px-3 sm:py-3 sm:text-xs sm:tracking-[0.18em]">
              {day}
            </div>
          ))}
          {leadingBlanks.map((_, index) => (
            <div key={`blank-${index}`} className="min-h-20 rounded-2xl border border-border/60 bg-muted/30 sm:min-h-28" />
          ))}
          {days.map((day) => {
            const dayExams = exams.filter((exam) => sameDate(new Date(exam.examDate), day));
            return (
              <div key={day.toISOString()} className="min-h-24 rounded-2xl border border-border bg-card p-2 sm:min-h-32 sm:p-3">
                <p className="text-xs font-bold text-text sm:text-sm">{day.getDate()}</p>
                <div className="mt-2 space-y-1.5 sm:space-y-2">
                  {dayExams.map((exam) => (
                    <div key={exam.id} className="rounded-xl bg-accentSoft px-2 py-2 text-[10px] text-accent sm:text-xs">
                      <p className="font-bold">{exam.title}</p>
                      <p>{(exam.kind || "exam") === "event" ? "Event" : exam.subjectName}</p>
                      {exam.startTime ? <p>{exam.startTime}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
