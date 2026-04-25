import { deleteTeacherAction, saveTeacherAction } from "@/lib/actions/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { requireUser } from "@/lib/auth/guards";
import { getAllSubjects, getAllTeachers } from "@/lib/data";
import { Panel } from "@/components/ui/panel";

export default async function TeachersPage() {
  await requireUser();
  const [teachers, subjects, user] = await Promise.all([getAllTeachers(), getAllSubjects(), getCurrentUser()]);
  const isAdmin = user?.role === "admin";
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject.name]));

  return (
    <div className="space-y-5">
      {isAdmin ? (
        <Panel>
          <h2 className="font-heading text-xl font-semibold text-text">Teacher management</h2>
          <p className="mt-2 text-sm text-subtle">Admins can add or remove teachers and link them to one or more subjects.</p>

          <form action={saveTeacherAction} className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
            <div className="space-y-4">
              <input name="name" placeholder="Teacher name" required className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
              <input name="designation" placeholder="Designation" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
              <input name="email" type="email" placeholder="Email" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
              <input name="phone" placeholder="Phone" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
              <button className="w-full rounded-2xl bg-accent px-4 py-3 font-medium text-white transition hover:opacity-90">Save teacher</button>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-medium text-text">Assign subjects</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {subjects.map((subject) => (
                  <label key={subject.id} className="flex items-center gap-3 text-sm text-subtle">
                    <input type="checkbox" name="subjectIds" value={subject.id} className="rounded border-border" />
                    <span>
                      {subject.name} ({subject.code})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel>
        <h2 className="font-heading text-xl font-semibold text-text">Teacher directory</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-text">{teacher.name}</p>
                  <p className="text-sm text-subtle">{teacher.designation || "Faculty member"}</p>
                </div>
                {isAdmin ? (
                  <form action={deleteTeacherAction}>
                    <input type="hidden" name="id" value={teacher.id} />
                    <button className="text-xs font-medium text-danger">Delete</button>
                  </form>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-subtle">{teacher.email || "No email added"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(teacher.subjectIds ?? []).map((subjectId) => (
                  <span key={subjectId} className="rounded-full bg-accentSoft px-3 py-1 text-xs font-medium text-accent">
                    {subjectMap.get(subjectId) ?? "Subject"}
                  </span>
                ))}
                {!(teacher.subjectIds ?? []).length ? (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-subtle">No subject assigned</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
