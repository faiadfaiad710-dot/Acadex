import { getAllExams, getAllFiles, getAllNotices, getAllSubjects, getAllLabs, getAllTeachers } from "@/lib/data";
import { requireUser } from "@/lib/auth/guards";
import { SearchPanel } from "@/components/dashboard/search-panel";
import { ExamCalendar } from "@/components/calendar/exam-calendar";
import { Panel } from "@/components/ui/panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatDate, getDownloadUrl, truncate } from "@/lib/utils";

export default async function DashboardPage() {
  await requireUser();
  const [files, subjects, notices, labs, teachers, exams] = await Promise.all([
    getAllFiles(),
    getAllSubjects(),
    getAllNotices(),
    getAllLabs(),
    getAllTeachers(),
    getAllExams()
  ]);
  const pdfFiles = files.filter((file) => {
    const type = file.fileType?.toLowerCase() ?? "";
    const title = file.title.toLowerCase();
    const url = file.fileUrl.toLowerCase();
    return type.includes("pdf") || title.endsWith(".pdf") || url.includes(".pdf");
  });

  return (
    <div className="space-y-5">
      <section className="glass-card relative overflow-hidden rounded-[32px] border border-border/70 p-6 text-center shadow-card sm:p-8">
        <div className="animated-aurora absolute inset-0 -z-10 opacity-40" />
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-subtle">Welcome to</p>
        <h2 className="brand-gradient mt-2 font-heading text-6xl font-black tracking-tight sm:text-8xl">Acadex</h2>
        <p className="mt-3 text-sm font-medium text-subtle">Your academic files, notices, calendar, teachers, and labs in one place.</p>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Subjects" value={subjects.length} helper="Available course boxes" />
        <StatCard label="Total classes" value={subjects.length} helper="Classes linked by subject" />
        <StatCard label="PDF uploaded" value={pdfFiles.length || files.length} helper="Downloadable study files" />
        <StatCard label="Notices" value={notices.length} helper="Latest academic notices" />
      </div>

      <SearchPanel files={files} subjects={subjects} />

      <section id="calendar">
        <ExamCalendar exams={exams} />
      </section>

      <Panel>
        <h3 className="font-heading text-lg font-semibold text-text">Subjects</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <div key={subject.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="font-medium text-text">{subject.name}</p>
              <p className="mt-1 text-sm text-subtle">{subject.code}</p>
              <p className="mt-3 text-xs text-subtle">
                {files.filter((file) => file.subjectId === subject.id).length} file(s)
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <h3 className="font-heading text-lg font-semibold text-text">Latest notices</h3>
          <div className="mt-4 space-y-3">
            {notices.slice(0, 6).map((notice) => (
              <div key={notice.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-sm text-text">{notice.text}</p>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-subtle">
                  <span>{formatDate(notice.date)}</span>
                  {notice.fileUrl ? (
                    <div className="flex items-center gap-3">
                      <a href={notice.fileUrl} target="_blank" rel="noreferrer" className="font-medium text-accent">
                        View
                      </a>
                      <a href={getDownloadUrl(notice.fileUrl)} download className="font-medium text-accent">
                        Download
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <h3 className="font-heading text-lg font-semibold text-text">Teachers and labs</h3>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-subtle">Teachers</p>
              <div className="mt-3 space-y-2">
                {teachers.slice(0, 5).map((teacher) => (
                  <div key={teacher.id} className="rounded-2xl border border-border bg-card p-4">
                    <p className="font-medium text-text">{teacher.name}</p>
                    <p className="text-sm text-subtle">{teacher.designation || "Faculty"}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-subtle">Lab resources</p>
              <div className="mt-3 space-y-2">
                {labs.slice(0, 4).map((lab) => (
                  <div key={lab.id} className="rounded-2xl border border-border bg-card p-4">
                    <p className="font-medium text-text">{truncate(lab.title, 55)}</p>
                    <p className="text-sm text-subtle">{lab.subjectName}</p>
                    {lab.fileUrl ? (
                      <div className="mt-2 flex gap-3 text-sm font-medium">
                        <a href={lab.fileUrl} target="_blank" rel="noreferrer" className="text-accent">
                          Open
                        </a>
                        <a href={getDownloadUrl(lab.fileUrl)} download className="text-accent">
                          Download
                        </a>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
