"use client";

import { useMemo, useState } from "react";
import { DeleteFileButton } from "@/components/upload/delete-file-button";
import { FileRecord } from "@/lib/types";
import { bytesToSize, formatDate, getFileDownloadHref, getFileViewerHref } from "@/lib/utils";

interface UploadedFilesListProps {
  files: FileRecord[];
}

export function UploadedFilesList({ files }: UploadedFilesListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = files.length > 0 && selectedIds.length === files.length;

  const toggleOne = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : files.map((file) => file.id));
  };

  const downloadSelected = () => {
    const selectedFiles = files.filter((file) => selectedSet.has(file.id));
    selectedFiles.forEach((file, index) => {
      window.setTimeout(() => {
        window.open(getFileDownloadHref(file.id), "_blank", "noopener,noreferrer");
      }, index * 220);
    });
  };

  return (
    <div className="mt-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/35 px-4 py-3">
        <label className="flex items-center gap-2 text-sm font-medium text-text">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="size-4 accent-[var(--color-accent)]" />
          Select all
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-subtle">{selectedIds.length} selected</span>
          <button
            type="button"
            disabled={!selectedIds.length}
            onClick={downloadSelected}
            className="rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Download selected
          </button>
        </div>
      </div>

      {files.map((file) => (
        <div key={file.id} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedSet.has(file.id)}
                onChange={() => toggleOne(file.id)}
                className="mt-1 size-4 accent-[var(--color-accent)]"
              />
              <div>
                <p className="font-medium text-text">{file.title}</p>
                <p className="text-sm text-subtle">{file.subjectName}</p>
              </div>
            </div>
            <div className="text-xs text-subtle">
              <p>{formatDate(file.uploadDate)}</p>
              <p>{bytesToSize(file.fileSize)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 font-medium">
                <a href={getFileViewerHref(file.id)} className="text-accent">
                  Open
                </a>
                <a href={getFileDownloadHref(file.id)} target="_blank" rel="noreferrer" className="text-accent">
                  Download
                </a>
                <DeleteFileButton fileId={file.id} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
