import { deleteExamAction, saveExamAction } from "@/lib/actions/admin";
import { requireUser } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { getAllExams, getAllSubjects } from "@/lib/data";
import { ExamCalendar } from "@/components/calendar/exam-calendar";
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
          <form action={saveExamAction} className="mt-6 space-y-4">
            <select name="kind" defaultValue="exam" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent">
              <option value="exam">Exam</option>
              <option value="event">Event</option>
            </select>
            <input name="title" required placeholder="Exam title" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
            <select name="subjectId" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent">
              <option value="">General event (no subject)</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
            <input name="examDate" required type="date" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
            <input name="startTime" type="time" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
            <input name="room" placeholder="Room or hall" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
            <textarea name="note" rows={3} placeholder="Extra note" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
            <button className="w-full rounded-2xl bg-accent px-4 py-3 font-medium text-white transition hover:opacity-90">Save exam</button>
          </form>
        </Panel>
      ) : null}

      <div className="space-y-5">
        <ExamCalendar exams={exams} />
        <Panel>
          <h2 className="font-heading text-xl font-semibold text-text">All exam and event dates</h2>
          <div className="mt-5 grid gap-3">
            {exams.map((exam) => (
              <div key={exam.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-text">{exam.title}</p>
                    <p className="text-sm text-subtle">
                      {(exam.kind || "exam") === "event" ? "General event" : exam.subjectName}
                    </p>
                    {exam.room ? <p className="mt-1 text-sm text-subtle">Room: {exam.room}</p> : null}
                    {exam.note ? <p className="mt-1 text-sm text-subtle">{exam.note}</p> : null}
                  </div>
                  <div className="text-sm text-subtle">
                    <p>{formatDate(exam.examDate)}</p>
                    {exam.startTime ? <p>{exam.startTime}</p> : null}
                    {isAdmin ? (
                      <form action={deleteExamAction} className="mt-2">
                        <input type="hidden" name="id" value={exam.id} />
                        <button className="font-medium text-danger">Delete</button>
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
