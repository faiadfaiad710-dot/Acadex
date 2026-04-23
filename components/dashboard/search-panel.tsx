"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { FileRecord, Subject } from "@/lib/types";
import { Panel } from "@/components/ui/panel";
import { formatDate, getFileDownloadHref, getFileOpenHref } from "@/lib/utils";
import { useAppConfig } from "@/providers/app-providers";

export function SearchPanel({
  files,
  subjects
}: {
  files: FileRecord[];
  subjects: Subject[];
}) {
  const { dictionary } = useAppConfig();
  const [query, setQuery] = useState("");

  const subjectMap = useMemo(() => {
    return new Map(subjects.map((subject) => [subject.id, subject.name]));
  }, [subjects]);

  const results = useMemo(() => {
    const value = query.toLowerCase().trim();
    if (!value) return files;

    return files.filter((file) => {
      const subjectName = subjectMap.get(file.subjectId) ?? file.subjectName;
      return file.title.toLowerCase().includes(value) || subjectName.toLowerCase().includes(value);
    });
  }, [files, query, subjectMap]);

  return (
    <Panel>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold text-text">{dictionary.searchResults}</h3>
          <p className="text-sm text-subtle">Live filtering updates on every keystroke.</p>
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

      <div className="mt-5 grid gap-3">
        {results.slice(0, 12).map((file, index) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="rounded-2xl border border-border bg-card p-4 transition hover:border-accent/40 hover:shadow-md"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-text">{file.title}</p>
                <p className="mt-1 text-sm text-subtle">{file.subjectName}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="text-subtle">{formatDate(file.uploadDate)}</span>
                <a href={getFileOpenHref(file.id)} target="_blank" rel="noreferrer" className="rounded-full bg-accentSoft px-3 py-1 font-medium text-accent">
                  Open
                </a>
                <a href={getFileDownloadHref(file.id)} className="rounded-full bg-accent px-3 py-1 font-medium text-white">
                  Download
                </a>
              </div>
            </div>
          </motion.div>
        ))}
        {results.length === 0 ? <p className="text-sm text-subtle">No matching files found.</p> : null}
      </div>
    </Panel>
  );
}
