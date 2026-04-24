import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import {
  getAllExams,
  getAllFiles,
  getAllLabs,
  getAllNotices,
  getAllSubjectResources,
  getAllSubjects
} from "@/lib/data";
import { Panel } from "@/components/ui/panel";
import {
  formatDate,
  getFileDownloadHref,
  getFileViewerHref,
  getNoticeDownloadHref,
  getNoticeViewerHref,
  getSubjectResourceDownloadHref,
  getSubjectResourceViewerHref
} from "@/lib/utils";

type UpdateItem = {
  id: string;
  kind: "notice" | "file" | "resource" | "lab" | "calendar";
  title: string;
  description: string;
  date: string;
  openHref?: string;
  downloadHref?: string;
};

export default async function UpdatesPage() {
  await requireUser();
  const [files, notices, resources, labs, exams, subjects] = await Promise.all([
    getAllFiles(),
    getAllNotices(),
    getAllSubjectResources(),
    getAllLabs(),
    getAllExams(),
    getAllSubjects()
  ]);

  const subjectNameById = new Map(subjects.map((subject) => [subject.id, subject.name]));

  const updates: UpdateItem[] = [
    ...notices.map((notice) => ({
      id: `notice-${notice.id}`,
      kind: "notice" as const,
      title: notice.text || notice.attachmentName || "New notice",
      description: notice.fileUrl ? "Notice attachment available" : "Text notice",
      date: notice.date,
      openHref: notice.fileUrl ? getNoticeViewerHref(notice.id) : `/notices/${notice.id}`,
      downloadHref: notice.fileUrl ? getNoticeDownloadHref(notice.id) : undefined
    })),
    ...files.map((file) => ({
      id: `file-${file.id}`,
      kind: "file" as const,
      title: file.title,
      description: `Uploaded in ${file.subjectName}`,
      date: file.uploadDate,
      openHref: getFileViewerHref(file.id),
      downloadHref: getFileDownloadHref(file.id)
    })),
    ...resources
      .filter((resource) => resource.type === "file")
      .map((resource) => ({
        id: `resource-${resource.id}`,
        kind: "resource" as const,
        title: resource.originalName || resource.name,
        description: `Subject resource in ${subjectNameById.get(resource.subjectId) || "subject"}`,
        date: resource.createdAt || "",
        openHref: getSubjectResourceViewerHref(resource.id),
        downloadHref: getSubjectResourceDownloadHref(resource.id)
      })),
    ...labs.map((lab) => ({
      id: `lab-${lab.id}`,
      kind: "lab" as const,
      title: lab.title,
      description: `Lab update for ${lab.subjectName}`,
      date: lab.date,
      openHref: lab.fileUrl || undefined,
      downloadHref: lab.fileUrl || undefined
    })),
    ...exams.map((exam) => ({
      id: `calendar-${exam.id}`,
      kind: "calendar" as const,
      title: exam.title,
      description: `${exam.kind === "event" ? "Event" : "Exam"} on ${exam.subjectName || "General schedule"}`,
      date: exam.createdAt || exam.examDate,
      openHref: "/calendar"
    }))
  ]
    .filter((item) => item.date)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

  return (
    <Panel>
      <h2 className="font-heading text-xl font-semibold text-text">Updates</h2>
      <p className="mt-2 text-sm text-subtle">See new files, notices, lab uploads, subject resources, and calendar changes in one place.</p>

      <div className="mt-5 space-y-3">
        {updates.length ? (
          updates.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-subtle">
                      {item.kind}
                    </span>
                    <span className="text-xs text-subtle">{formatDate(item.date)}</span>
                  </div>
                  <p className="mt-3 font-medium text-text">{item.title}</p>
                  <p className="mt-1 text-sm text-subtle">{item.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                  {item.openHref ? (
                    item.openHref.startsWith("http") ? (
                      <a href={item.openHref} target="_blank" rel="noreferrer" className="text-accent">
                        Open
                      </a>
                    ) : (
                      <Link href={item.openHref} className="text-accent">
                        Open
                      </Link>
                    )
                  ) : null}
                  {item.downloadHref ? (
                    <a href={item.downloadHref} target="_blank" rel="noreferrer" className="text-accent">
                      Download
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-subtle">No updates yet.</div>
        )}
      </div>
    </Panel>
  );
}
