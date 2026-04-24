"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Semester, Subject } from "@/lib/types";

export function SemesterFilter({
  semesters,
  subjects
}: {
  semesters: Semester[];
  subjects: Subject[];
}) {
  const [semesterId, setSemesterId] = useState("all");

  const filteredSubjects = useMemo(() => {
    if (semesterId === "all") return subjects;
    return subjects.filter((subject) => subject.semesterId === semesterId);
  }, [semesterId, subjects]);

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold text-text">Subject Boxes</h2>
          <p className="text-sm text-subtle">Click any subject box to open its dedicated page.</p>
        </div>
        <select
          value={semesterId}
          onChange={(event) => setSemesterId(event.target.value)}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent"
        >
          <option value="all">All semesters</option>
          {semesters.map((semester) => (
            <option key={semester.id} value={semester.id}>
              {semester.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredSubjects.map((subject, index) => (
          <motion.div
            key={subject.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.3 }}
          >
            <Link
              href={`/subjects/${encodeURIComponent(subject.id)}`}
              className="interactive-lift block rounded-[30px] border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-accentSoft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                  Subject Box
                </span>
                <span className="text-xs text-subtle">{subject.semesterName || "No semester"}</span>
              </div>
              <h3 className="mt-4 font-heading text-2xl font-bold text-text">{subject.name}</h3>
              <p className="mt-2 text-sm text-subtle">{subject.code}</p>
              <p className="mt-4 text-sm font-medium text-accent">Open subject</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </>
  );
}
