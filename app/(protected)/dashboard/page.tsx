import Link from "next/link";
import {
  getAllExams,
  getAllFiles,
  getAllNotices,
  getAllSubjects,
  getAllLabs,
  getAllTeachers,
  getAllSubjectResources
} from "@/lib/data";
import { requireUser } from "@/lib/auth/guards";
import { SearchPanel } from "@/components/dashboard/search-panel";
import { ExamCalendar } from "@/components/calendar/exam-calendar";
import { Panel } from "@/components/ui/panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatDate, getNoticeDownloadHref } from "@/lib/utils";

export default async function DashboardPage() {
  await requireUser();
  const [files, subjects, notices, labs, teachers, exams, subjectResources] = await Promise.all([
    getAllFiles(),
    getAllSubjects(),
    getAllNotices(),
    getAllLabs(),
    getAllTeachers(),
    getAllExams(),
    getAllSubjectResources()
  ]);

  function isPdfEntry(entry: {
    fileType?: string;
    format?: string;
    title?: string;
    name?: string;
    fileUrl?: string;
    attachmentName?: string;
  }) {
    const type = entry.fileType?.toLowerCase() ?? "";
    const format = entry.format?.toLowerCase() ?? "";
    const title = (entry.title || entry.name || entry.attachmentName || "").toLowerCase();
    const url = (entry.fileUrl || "").toLowerCase();
    return type.includes("pdf") || format === "pdf" || title.endsWith(".pdf") || url.includes(".pdf");
  }

  const totalPdfCount =
    files.filter(isPdfEntry).length +
    subjectResources.filter((resource) => resource.type === "file" && isPdfEntry(resource)).length +
    notices.filter(isPdfEntry).length +
    labs.filter(isPdfEntry).length;

  return (
    <div className="space-y-5">
      <section className="glass-card relative overflow-hidden rounded-[32px] border border-border/70 p-6 shadow-card sm:p-8">
        <div className="animated-aurora absolute inset-0 -z-10 opacity-40" />
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-subtle">Welcome to</p>
            <h2 className="brand-gradient mt-2 font-heading text-5xl font-black tracking-tight sm:text-7xl">Acadex</h2>
            <p className="mt-3 text-sm font-medium text-subtle">Your academic files, notices, calendar, teachers, and labs in one place.</p>
          </div>
          <SearchPanel files={files} subjects={subjects} notices={notices} labs={labs} teachers={teachers} resources={subjectResources} compact />
        </div>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Subjects" value={subjects.length} helper="Available course boxes" />
        <StatCard label="Total files" value={files.length + subjectResources.filter((resource) => resource.type === "file").length} helper="Website files and subject files" />
        <StatCard label="PDF uploaded" value={totalPdfCount} helper="PDF files across the website" />
        <StatCard label="Notices" value={notices.length} helper="Latest academic notices" />
      </div>

      <section id="calendar">
        <ExamCalendar exams={exams} />
      </section>

      <Panel>
        <h3 className="font-heading text-lg font-semibold text-text">Latest notices</h3>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {notices.slice(0, 6).map((notice) => (
            <div key={notice.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm text-text">{notice.text || "Attachment-only notice"}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-subtle">
                <span>{formatDate(notice.date)}</span>
                <Link href={`/notices/${notice.id}`} className="font-medium text-accent">
                  Open in website
                </Link>
                {notice.fileUrl ? (
                  <a href={getNoticeDownloadHref(notice.id)} target="_blank" rel="noreferrer" className="font-medium text-accent">
                    Download
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
