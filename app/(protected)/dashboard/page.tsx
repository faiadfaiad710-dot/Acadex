import Link from "next/link";
import {
  getAdminReadingInsight,
  getAllExams,
  getAllFiles,
  getAllNotices,
  getAllSubjects,
  getAllLabs,
  getStudentReadingInsight,
  getAllTeachers,
  getAllSubjectResources
} from "@/lib/data";
import { requireUser } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { BarChart } from "@/components/dashboard/bar-chart";
import { SearchPanel } from "@/components/dashboard/search-panel";
import { ExamCalendar } from "@/components/calendar/exam-calendar";
import { Panel } from "@/components/ui/panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatDate, getNoticeDownloadHref } from "@/lib/utils";

export default async function DashboardPage() {
  await requireUser();
  const [user, files, subjects, notices, labs, teachers, exams, subjectResources] = await Promise.all([
    getCurrentUser(),
    getAllFiles(),
    getAllSubjects(),
    getAllNotices(),
    getAllLabs(),
    getAllTeachers(),
    getAllExams(),
    getAllSubjectResources()
  ]);
  const [studentInsight, adminInsight] = await Promise.all([
    user ? getStudentReadingInsight(user.uid) : Promise.resolve({ favoriteSubjectName: "No subject yet", favoriteSubjectCount: 0, monthlyReads: [] }),
    user?.role === "admin" ? getAdminReadingInsight() : Promise.resolve(null)
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

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Subjects" value={subjects.length} helper="Available course boxes" />
        <StatCard label="Total files" value={files.length + subjectResources.filter((resource) => resource.type === "file").length} helper="Website files and subject files" />
        <StatCard label="PDF uploaded" value={totalPdfCount} helper="PDF files across the website" />
        <StatCard label="Notices" value={notices.length} helper="Latest academic notices" />
        <StatCard label="Most read this month" value={studentInsight.favoriteSubjectName} helper={`${studentInsight.favoriteSubjectCount} reading activity this month`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <BarChart title="Your subject reading this month" data={studentInsight.monthlyReads} />
        {user?.role === "admin" && adminInsight ? (
          <BarChart title="Most opened subjects this month" data={adminInsight.popularSubjects} />
        ) : (
          <Panel>
            <h3 className="font-heading text-lg font-semibold text-text">Reading focus</h3>
            <p className="mt-2 text-sm text-subtle">Acadex tracks which subjects you open and read most often this month.</p>
            <div className="mt-5 space-y-3">
              {studentInsight.monthlyReads.slice(0, 4).map((item) => (
                <div key={item.subject} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
                  <span className="text-sm font-medium text-text">{item.subject}</span>
                  <span className="text-sm text-subtle">{item.total}</span>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>

      {user?.role === "admin" && adminInsight ? (
        <Panel>
          <h3 className="font-heading text-lg font-semibold text-text">User reading activity</h3>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {adminInsight.userReads.slice(0, 8).map((reader) => (
              <div key={reader.uid} className="rounded-2xl border border-border bg-card p-4">
                <p className="font-medium text-text">{reader.userLabel}</p>
                <p className="mt-2 text-sm text-subtle">Top subject this month: {reader.topSubjectName}</p>
                <p className="mt-1 text-sm text-subtle">Last entered: {reader.lastSubjectName}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-subtle">
                  <span>{reader.totalReads} reading actions</span>
                  <span>{reader.lastEnteredAt ? formatDate(reader.lastEnteredAt) : "-"}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

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
