import {
  deleteSemesterAction,
  deleteSubjectAction,
  saveSemesterAction,
  saveSubjectAction,
  seedDefaultSubjectsAction
} from "@/lib/actions/admin";
import { requireUser } from "@/lib/auth/guards";
import { getAllSemesters, getAllSubjects } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth/session";
import { Panel } from "@/components/ui/panel";
import { SemesterFilter } from "@/components/subjects/semester-filter";

export default async function SubjectsPage() {
  await requireUser();
  const [subjects, semesters, currentUser] = await Promise.all([
    getAllSubjects(),
    getAllSemesters(),
    getCurrentUser()
  ]);
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="space-y-5">
      {isAdmin ? (
        <Panel>
          <h2 className="font-heading text-xl font-semibold text-text">Manage semesters and subjects</h2>
          <p className="mt-2 text-sm text-subtle">Create semesters, then subjects. Each subject comes with Major and Minor sections, and you can add more custom sections anytime.</p>
          <form action={saveSemesterAction} className="mt-6 space-y-4">
            <input name="name" placeholder="Semester name" required className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
            <button className="w-full rounded-2xl border border-border bg-card px-4 py-3 font-medium text-text transition hover:border-accent">Save semester</button>
          </form>
          <div className="mt-4 space-y-2">
            {semesters.map((semester) => (
              <div key={semester.id} className="flex items-center justify-between rounded-2xl bg-muted/70 px-4 py-3">
                <span className="text-sm font-medium text-text">{semester.name}</span>
                <form action={deleteSemesterAction}>
                  <input type="hidden" name="id" value={semester.id} />
                  <button className="text-xs font-medium text-danger">Delete</button>
                </form>
              </div>
            ))}
          </div>
          <form action={saveSubjectAction} className="mt-6 space-y-4">
            <select name="semesterId" required className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" defaultValue="">
              <option value="" disabled>
                Select semester
              </option>
              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name}
                </option>
              ))}
            </select>
            <input name="name" placeholder="Subject name" required className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
            <input name="code" placeholder="Subject code" required className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
            <button className="w-full rounded-2xl bg-accent px-4 py-3 font-medium text-white transition hover:opacity-90">Save subject</button>
          </form>
          <form action={seedDefaultSubjectsAction} className="mt-4">
            <button className="w-full rounded-2xl border border-border bg-card px-4 py-3 font-medium text-text transition hover:border-accent">Seed default subjects</button>
          </form>
        </Panel>
      ) : null}

      <Panel>
        <SemesterFilter semesters={semesters} subjects={subjects} />
        {isAdmin ? <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {subjects.map((subject) => (
            <div key={subject.id} className="rounded-2xl border border-border bg-card p-4">
              <>
                <form action={saveSubjectAction} className="space-y-3">
                  <input type="hidden" name="id" value={subject.id} />
                  <select name="semesterId" defaultValue={subject.semesterId || ""} className="w-full rounded-2xl border border-border bg-base px-3 py-2 text-sm outline-none focus:border-accent">
                    <option value="">No semester</option>
                    {semesters.map((semester) => (
                      <option key={semester.id} value={semester.id}>
                        {semester.name}
                      </option>
                    ))}
                  </select>
                  <input defaultValue={subject.name} name="name" className="w-full rounded-2xl border border-border bg-base px-3 py-2 text-sm outline-none focus:border-accent" />
                  <input defaultValue={subject.code} name="code" className="w-full rounded-2xl border border-border bg-base px-3 py-2 text-sm outline-none focus:border-accent" />
                  <button className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-white">Update</button>
                </form>
                <form action={deleteSubjectAction} className="mt-3">
                  <input type="hidden" name="id" value={subject.id} />
                  <button className="text-xs font-medium text-danger">Delete</button>
                </form>
              </>
            </div>
          ))}
        </div> : null}
      </Panel>
    </div>
  );
}
