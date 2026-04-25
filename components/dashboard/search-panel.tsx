"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { FileRecord, LabRecord, Notice, Subject, SubjectResource, Teacher } from "@/lib/types";
import {
  formatDate,
  getFileDownloadHref,
  getFileViewerHref,
  getNoticeDownloadHref,
  getNoticeViewerHref,
  getSubjectResourceDownloadHref,
  getSubjectResourceViewerHref
} from "@/lib/utils";
import { useAppConfig } from "@/providers/app-providers";

export function SearchPanel({
  files,
  subjects,
  notices,
  labs,
  teachers,
  resources,
  compact = false
}: {
  files: FileRecord[];
  subjects: Subject[];
  notices: Notice[];
  labs: LabRecord[];
  teachers: Teacher[];
  resources: SubjectResource[];
  compact?: boolean;
}) {
  const { dictionary } = useAppConfig();
  const [query, setQuery] = useState("");

  const subjectMap = useMemo(() => {
    return new Map(subjects.map((subject) => [subject.id, subject.name]));
  }, [subjects]);

  const results = useMemo(() => {
    const value = query.toLowerCase().trim();
    if (!value) return [];

    const resourceFiles = resources.filter((resource) => resource.type === "file");

    const allResults = [
      ...files.map((file) => ({
        id: file.id,
        kind: "File",
        title: file.title,
        subtitle: file.subjectName,
        date: file.uploadDate,
        openHref: getFileViewerHref(file.id),
        downloadHref: getFileDownloadHref(file.id)
      })),
      ...resourceFiles.map((resource) => ({
        id: resource.id,
        kind: "Subject file",
        title: resource.originalName || resource.name,
        subtitle: subjectMap.get(resource.subjectId) || "Subject resource",
        date: resource.createdAt || "",
        openHref: getSubjectResourceViewerHref(resource.id),
        downloadHref: getSubjectResourceDownloadHref(resource.id)
      })),
      ...notices.map((notice) => ({
        id: notice.id,
        kind: "Notice",
        title: notice.text || notice.attachmentName || "Notice",
        subtitle: notice.fileUrl ? "Notice attachment available" : "Announcement",
        date: notice.date,
        openHref: notice.fileUrl ? getNoticeViewerHref(notice.id) : `/notices/${notice.id}`,
        downloadHref: notice.fileUrl ? getNoticeDownloadHref(notice.id) : ""
      })),
      ...labs.map((lab) => ({
        id: lab.id,
        kind: "Lab",
        title: lab.title,
        subtitle: lab.subjectName,
        date: lab.date,
        openHref: lab.fileUrl || "",
        downloadHref: lab.fileUrl || ""
      })),
      ...teachers.map((teacher) => ({
        id: teacher.id,
        kind: "Teacher",
        title: teacher.name,
        subtitle: teacher.designation || "Faculty",
        date: teacher.createdAt || "",
        openHref: "/teachers",
        downloadHref: ""
      })),
      ...subjects.map((subject) => ({
        id: subject.id,
        kind: "Subject",
        title: subject.name,
        subtitle: subject.code,
        date: subject.createdAt || "",
        openHref: `/subjects/${subject.id}`,
        downloadHref: ""
      }))
    ];

    return allResults.filter((item) => {
      return item.title.toLowerCase().includes(value) || item.subtitle.toLowerCase().includes(value) || item.kind.toLowerCase().includes(value);
    });
  }, [files, labs, notices, query, resources, subjectMap, subjects, teachers]);

  return (
    <div className={compact ? "space-y-3" : "rounded-[28px] border border-border/70 bg-card/70 p-5"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold text-text">{compact ? "Search Acadex" : dictionary.searchResults}</h3>
          <p className="text-sm text-subtle">{compact ? "Find files, notices, teachers, labs, and subjects." : "Live filtering updates on every keystroke."}</p>
        </div>
        <label className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 sm:max-w-md">
          <Search className="size-4 text-subtle" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={dictionary.searchPlaceholder}
            className="w-full bg-transparent text-sm text-text outline-none placeholder:text-subtle"
          />
        </label>
      </div>

      {query.trim() ? <div className="mt-5 grid gap-3">
        {results.slice(0, compact ? 8 : 12).map((item, index) => (
          <motion.div
            key={`${item.kind}-${item.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="rounded-2xl border border-border bg-card p-4 transition hover:border-accent/40 hover:shadow-md"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-text">{item.title}</p>
                  <span className="rounded-full bg-accentSoft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
                    {item.kind}
                  </span>
                </div>
                <p className="mt-1 text-sm text-subtle">{item.subtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="text-subtle">{formatDate(item.date)}</span>
                <a href={item.openHref} className="rounded-full bg-accentSoft px-3 py-1 font-medium text-accent">
                  Open
                </a>
                {item.downloadHref ? (
                  <a href={item.downloadHref} target="_blank" rel="noreferrer" className="rounded-full bg-accent px-3 py-1 font-medium text-white">
                    Download
                  </a>
                ) : null}
              </div>
            </div>
          </motion.div>
        ))}
        {results.length === 0 ? <p className="text-sm text-subtle">No matching files found.</p> : null}
      </div> : null}
    </div>
  );
}
