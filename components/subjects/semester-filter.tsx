"use client";

import { useMemo, useState } from "react";
import { Semester, Subject, FileRecord } from "@/lib/types";
import { getFileDownloadHref, getFileOpenHref } from "@/lib/utils";

export function SemesterFilter({
  semesters,
  subjects,
  files,
  isAdmin
}: {
  semesters: Semester[];
  subjects: Subject[];
  files: FileRecord[];
  isAdmin: boolean;
}) {
  const [semesterId, setSemesterId] = useState<string>("all");

  const filteredSubjects = useMemo(() => {
    if (semesterId === "all") return subjects;
    return subjects.filter((subject) => subject.semesterId === semesterId);
  }, [semesterId, subjects]);

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-xl font-semibold text-text">Available subjects</h2>
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
      <div className="grid gap-3 sm:grid-cols-2">
        {filteredSubjects.map((subject) => (
          <div key={subject.id} className="rounded-2xl border border-border bg-card p-4">
            {isAdmin ? (
              <div>
                <p className="font-medium text-text">{subject.name}</p>
                <p className="mt-1 text-sm text-subtle">{subject.code}</p>
                <p className="mt-1 text-xs text-subtle">{subject.semesterName || "No semester"}</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-text">{subject.name}</p>
                <p className="mt-1 text-sm text-subtle">{subject.code}</p>
                <p className="mt-1 text-xs text-subtle">{subject.semesterName || "No semester"}</p>
              </div>
            )}

            <div className="mt-4 space-y-2">
              {files
                .filter((file) => file.subjectId === subject.id)
                .slice(0, 6)
                .map((file) => (
                  <div key={file.id} className="rounded-2xl bg-muted/70 px-3 py-2 text-sm text-text">
                    <p className="font-medium">{file.title}</p>
                    <div className="mt-2 flex gap-3 text-xs font-medium">
                      <a href={getFileOpenHref(file.id)} target="_blank" rel="noreferrer" className="text-accent">
                        Open
                      </a>
                      <a href={getFileDownloadHref(file.id)} className="text-accent">
                        Download
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
