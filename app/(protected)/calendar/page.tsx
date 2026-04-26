import { deleteExamAction, saveExamAction } from "@/lib/actions/admin";
import { requireUser } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { getAllExams, getAllSubjects } from "@/lib/data";
import { ExamCalendar } from "@/components/calendar/exam-calendar";
import { CalendarEntryForm } from "@/components/calendar/calendar-entry-form";
import { Panel } from "@/components/ui/panel";
import { formatDate } from "@/lib/utils";

export default async function CalendarPage() {
  await requireUser();
  const [user, subjects, exams] = await Promise.all([getCurrentUser(), getAllSubjects(), getAllExams()]);
  const isAdmin = user?.role === "admin";

  return (
    <div className="grid gap-5 xl:grid-cols-[430px_1fr]">
      {isAdmin ? (
        <Panel>
          <h2 className="font-heading text-xl font-semibold text-text">Add exam or event date</h2>
          <p className="mt-2 text-sm text-subtle">Admin can publish both exam dates and general event dates for students.</p>
          <CalendarEntryForm subjects={subjects} action={saveExamAction} />
        </Panel>
      ) : null}

      <div className="space-y-5">
        <ExamCalendar exams={exams} />
        <Panel>
          <h2 className="font-heading text-xl font-semibold text-text">All exam and event dates</h2>
          <div className="mt-5 grid gap-3">
            {exams.map((exam) => (
              <div key={exam.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-text">{exam.title}</p>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-subtle">
                        {(exam.kind || "exam") === "event" ? "Event" : "Exam"}
                      </span>
                    </div>
                    <p className="text-sm text-subtle">
                      {(exam.kind || "exam") === "event" ? "General event" : exam.subjectName}
                    </p>
                    {exam.room ? <p className="mt-1 text-sm text-subtle">Room: {exam.room}</p> : null}
                    {exam.note ? <p className="mt-1 text-sm text-subtle">{exam.note}</p> : null}
                  </div>
                  <div className="flex flex-col items-start gap-2 text-sm text-subtle sm:items-end">
                    <p>{formatDate(exam.examDate)}</p>
                    {exam.startTime ? <p>{exam.startTime}</p> : null}
                    {isAdmin ? (
                      <form action={deleteExamAction}>
                        <input type="hidden" name="id" value={exam.id} />
                        <button className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
                          Delete {(exam.kind || "exam") === "event" ? "event" : "exam"}
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
