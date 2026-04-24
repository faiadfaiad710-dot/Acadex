"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, FileText, FolderClosed } from "lucide-react";
import { Subject, SubjectResource, SubjectSection, Teacher } from "@/lib/types";
import {
  getFileDownloadHref,
  getFileViewerHref,
  getSubjectResourceDownloadHref,
  getSubjectResourceViewerHref
} from "@/lib/utils";

export function SubjectDetailView({
  subject,
  sections,
  resources,
  legacyFiles,
  teachers,
  isAdmin,
  saveSubjectSectionAction,
  saveSubjectResourceAction,
  deleteSubjectSectionAction,
  deleteSubjectResourceAction
}: {
  subject: Subject;
  sections: SubjectSection[];
  resources: SubjectResource[];
  legacyFiles: { id: string; title: string }[];
  teachers: Teacher[];
  isAdmin: boolean;
  saveSubjectSectionAction: (formData: FormData) => void | Promise<void>;
  saveSubjectResourceAction: (formData: FormData) => void | Promise<void>;
  deleteSubjectSectionAction: (formData: FormData) => void | Promise<void>;
  deleteSubjectResourceAction: (formData: FormData) => void | Promise<void>;
}) {
  const [openSectionId, setOpenSectionId] = useState(sections[0]?.id || "");

  return (
    <div className="space-y-5">
      <div className="rounded-[32px] border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accentSoft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            Subject Box
          </span>
          <span className="text-xs text-subtle">{subject.semesterName || "No semester"}</span>
        </div>
        <h2 className="mt-4 font-heading text-3xl font-bold text-text">{subject.name}</h2>
        <p className="mt-2 text-sm text-subtle">{subject.code}</p>
      </div>

      {isAdmin ? (
        <div className="rounded-[28px] border border-border bg-card p-5">
          <p className="text-sm font-semibold text-text">Create section</p>
          <form action={saveSubjectSectionAction} className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px_220px_auto]">
            <input type="hidden" name="subjectId" value={subject.id} />
            <input name="name" placeholder="Section name" required className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent" />
            <select name="kind" defaultValue="custom" className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent">
              <option value="major">Major</option>
              <option value="minor">Minor</option>
              <option value="custom">Custom</option>
            </select>
            <select name="teacherId" defaultValue="" className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent">
              <option value="">Select teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
            <button className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white">Save</button>
          </form>
        </div>
      ) : null}

      <div className="space-y-4">
        {sections.map((section) => {
          const sectionResources = resources.filter((resource) => resource.sectionId === section.id);
          const isOpen = openSectionId === section.id;

          return (
            <div key={section.id} className="rounded-[28px] border border-border bg-card p-5">
              <button
                type="button"
                onClick={() => setOpenSectionId(isOpen ? "" : section.id)}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-subtle">
                      {section.kind}
                    </span>
                    {section.teacherName ? (
                      <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-text">
                        {section.teacherName}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 font-medium text-text">{section.name}</p>
                  <p className="mt-1 text-sm text-subtle">{sectionResources.length} published item(s)</p>
                </div>
                <ChevronDown className={`mt-1 size-5 text-subtle transition ${isOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.24 }}
                    className="overflow-hidden"
                  >
                    {isAdmin ? (
                      <div className="mt-4 space-y-3">
                        <form action={saveSubjectResourceAction} className="grid gap-3 lg:grid-cols-[1fr_150px_auto]">
                          <input type="hidden" name="subjectId" value={subject.id} />
                          <input type="hidden" name="sectionId" value={section.id} />
                          <input type="hidden" name="type" value="folder" />
                          <input name="name" placeholder="Folder name" required className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent" />
                          <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-sm text-subtle">Folder</div>
                          <button className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-text">Add folder</button>
                        </form>

                        <form action={saveSubjectResourceAction} className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                          <input type="hidden" name="subjectId" value={subject.id} />
                          <input type="hidden" name="sectionId" value={section.id} />
                          <input type="hidden" name="type" value="file" />
                          <input name="name" placeholder="File title" required className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent" />
                          <input name="file" type="file" required className="rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-sm" />
                          <button className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white">Upload file</button>
                        </form>

                        <form action={deleteSubjectSectionAction}>
                          <input type="hidden" name="id" value={section.id} />
                          <button className="text-xs font-medium text-danger">Delete section</button>
                        </form>
                      </div>
                    ) : null}

                    <div className="mt-4 space-y-2">
                      {sectionResources.map((resource) => (
                        <div key={resource.id} className="rounded-2xl border border-border bg-muted/40 px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 text-subtle">
                                {resource.type === "folder" ? <FolderClosed className="size-4" /> : <FileText className="size-4" />}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-text">{resource.name}</p>
                                <p className="text-xs uppercase tracking-[0.18em] text-subtle">
                                  {resource.type === "folder" ? "Folder" : "File"}
                                </p>
                              </div>
                            </div>
                            {isAdmin ? (
                              <form action={deleteSubjectResourceAction}>
                                <input type="hidden" name="id" value={resource.id} />
                                <button className="text-xs font-medium text-danger">Delete</button>
                              </form>
                            ) : null}
                          </div>
                          {resource.type === "file" ? (
                            <div className="mt-2 flex gap-3 text-xs font-medium">
                              <a href={getSubjectResourceViewerHref(resource.id)} className="text-accent">
                                Open
                              </a>
                              <a href={getSubjectResourceDownloadHref(resource.id)} target="_blank" rel="noreferrer" className="text-accent">
                                Download
                              </a>
                            </div>
                          ) : null}
                        </div>
                      ))}
                      {!sectionResources.length ? <p className="text-sm text-subtle">Nothing published in this section yet.</p> : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {legacyFiles.length ? (
        <div className="rounded-[28px] border border-border bg-card p-5">
          <p className="text-sm font-semibold text-text">Legacy files</p>
          <div className="mt-3 space-y-2">
            {legacyFiles.map((file) => (
              <div key={file.id} className="rounded-2xl border border-border bg-muted/40 px-3 py-3">
                <p className="text-sm font-medium text-text">{file.title}</p>
                <div className="mt-2 flex gap-3 text-xs font-medium">
                  <a href={getFileViewerHref(file.id)} className="text-accent">
                    Open
                  </a>
                  <a href={getFileDownloadHref(file.id)} target="_blank" rel="noreferrer" className="text-accent">
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
