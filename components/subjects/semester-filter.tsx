"use client";

import { useMemo, useState } from "react";
import { FileRecord, Semester, Subject, SubjectResource, SubjectSection, Teacher } from "@/lib/types";
import { getFileDownloadHref, getFileOpenHref } from "@/lib/utils";

interface SemesterFilterProps {
  semesters: Semester[];
  subjects: Subject[];
  files: FileRecord[];
  teachers: Teacher[];
  sections: SubjectSection[];
  resources: SubjectResource[];
  isAdmin: boolean;
  saveSubjectSectionAction: (formData: FormData) => void | Promise<void>;
  saveSubjectResourceAction: (formData: FormData) => void | Promise<void>;
  deleteSubjectSectionAction: (formData: FormData) => void | Promise<void>;
  deleteSubjectResourceAction: (formData: FormData) => void | Promise<void>;
}

export function SemesterFilter({
  semesters,
  subjects,
  files,
  teachers,
  sections,
  resources,
  isAdmin,
  saveSubjectSectionAction,
  saveSubjectResourceAction,
  deleteSubjectSectionAction,
  deleteSubjectResourceAction
}: SemesterFilterProps) {
  const [semesterId, setSemesterId] = useState<string>("all");

  const filteredSubjects = useMemo(() => {
    if (semesterId === "all") return subjects;
    return subjects.filter((subject) => subject.semesterId === semesterId);
  }, [semesterId, subjects]);

  const sectionsBySubject = useMemo(
    () =>
      sections.reduce<Record<string, SubjectSection[]>>((acc, section) => {
        (acc[section.subjectId] ||= []).push(section);
        return acc;
      }, {}),
    [sections]
  );

  const resourcesBySection = useMemo(
    () =>
      resources.reduce<Record<string, SubjectResource[]>>((acc, resource) => {
        (acc[resource.sectionId] ||= []).push(resource);
        return acc;
      }, {}),
    [resources]
  );

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

      <div className="grid gap-4">
        {filteredSubjects.map((subject) => {
          const subjectSections = sectionsBySubject[subject.id] ?? [];
          const ensuredSections = [
            ...subjectSections.filter((section) => section.kind === "major"),
            ...subjectSections.filter((section) => section.kind === "minor"),
            ...subjectSections.filter((section) => section.kind === "custom")
          ];
          const legacyFiles = files.filter((file) => file.subjectId === subject.id);

          return (
            <div key={subject.id} className="rounded-[28px] border border-border bg-card p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-text">{subject.name}</p>
                  <p className="mt-1 text-sm text-subtle">
                    {subject.code} • {subject.semesterName || "No semester"}
                  </p>
                </div>
                <p className="text-xs text-subtle">{legacyFiles.length} legacy file(s)</p>
              </div>

              {isAdmin ? (
                <div className="mt-4 rounded-2xl border border-border bg-muted/60 p-4">
                  <p className="text-sm font-semibold text-text">Add section</p>
                  <form action={saveSubjectSectionAction} className="mt-3 grid gap-3 lg:grid-cols-[1fr_180px_220px_auto]">
                    <input type="hidden" name="subjectId" value={subject.id} />
                    <input name="name" placeholder="Section name" required className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent" />
                    <select name="kind" defaultValue="custom" className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent">
                      <option value="major">Major</option>
                      <option value="minor">Minor</option>
                      <option value="custom">Custom section</option>
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

              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {ensuredSections.map((section) => {
                  const sectionResources = resourcesBySection[section.id] ?? [];
                  return (
                    <div key={section.id} className="rounded-2xl border border-border bg-muted/50 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-medium text-text">
                            {section.name}{" "}
                            <span className="text-xs uppercase tracking-[0.2em] text-subtle">({section.kind})</span>
                          </p>
                          <p className="mt-1 text-sm text-subtle">{section.teacherName || "No teacher assigned"}</p>
                        </div>
                        {isAdmin ? (
                          <form action={deleteSubjectSectionAction}>
                            <input type="hidden" name="id" value={section.id} />
                            <button className="text-xs font-medium text-danger">Delete section</button>
                          </form>
                        ) : null}
                      </div>

                      {isAdmin ? (
                        <div className="mt-4 space-y-3">
                          <form action={saveSubjectResourceAction} className="grid gap-3 lg:grid-cols-[1fr_160px_auto]">
                            <input type="hidden" name="subjectId" value={subject.id} />
                            <input type="hidden" name="sectionId" value={section.id} />
                            <input type="hidden" name="type" value="folder" />
                            <input name="name" placeholder="Folder name" required className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent" />
                            <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-sm text-subtle">
                              Create folder
                            </div>
                            <button className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-text">Add folder</button>
                          </form>

                          <form action={saveSubjectResourceAction} className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                            <input type="hidden" name="subjectId" value={subject.id} />
                            <input type="hidden" name="sectionId" value={section.id} />
                            <input type="hidden" name="type" value="file" />
                            <input name="name" placeholder="File label" required className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent" />
                            <input name="file" type="file" required className="rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-sm" />
                            <button className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white">Upload file</button>
                          </form>
                        </div>
                      ) : null}

                      <div className="mt-4 space-y-2">
                        {sectionResources.map((resource) => (
                          <div key={resource.id} className="rounded-2xl border border-border bg-card px-3 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-text">{resource.name}</p>
                                <p className="text-xs uppercase tracking-[0.2em] text-subtle">{resource.type}</p>
                              </div>
                              {isAdmin ? (
                                <form action={deleteSubjectResourceAction}>
                                  <input type="hidden" name="id" value={resource.id} />
                                  <button className="text-xs font-medium text-danger">Delete</button>
                                </form>
                              ) : null}
                            </div>

                            {resource.type === "file" && resource.fileUrl ? (
                              <div className="mt-2 flex gap-3 text-xs font-medium">
                                <a href={resource.fileUrl} target="_blank" rel="noreferrer" className="text-accent">
                                  Open
                                </a>
                                <a href={resource.fileUrl} download className="text-accent">
                                  Download
                                </a>
                              </div>
                            ) : null}
                          </div>
                        ))}
                        {!sectionResources.length ? <p className="text-sm text-subtle">No folders or files yet.</p> : null}
                      </div>
                    </div>
                  );
                })}

                {!ensuredSections.length ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-subtle">
                    No sections added yet. Admin can create Major, Minor, or custom sections for this subject.
                  </div>
                ) : null}
              </div>

              {legacyFiles.length ? (
                <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4">
                  <p className="text-sm font-semibold text-text">Legacy subject files</p>
                  <div className="mt-3 space-y-2">
                    {legacyFiles.slice(0, 6).map((file) => (
                      <div key={file.id} className="rounded-2xl bg-card px-3 py-2 text-sm text-text">
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
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
