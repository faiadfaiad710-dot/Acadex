import { deleteSubjectAction, saveSubjectAction, seedDefaultSubjectsAction } from "@/lib/actions/admin";
import { requireUser } from "@/lib/auth/guards";
import { getAllFiles, getAllSubjects } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth/session";
import { Panel } from "@/components/ui/panel";
import { getFileDownloadHref, getFileOpenHref } from "@/lib/utils";

export default async function SubjectsPage() {
  await requireUser();
  const [subjects, files, currentUser] = await Promise.all([getAllSubjects(), getAllFiles(), getCurrentUser()]);
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      {isAdmin ? (
        <Panel>
          <h2 className="font-heading text-xl font-semibold text-text">Manage subjects</h2>
          <p className="mt-2 text-sm text-subtle">Add new subjects or update existing names and codes.</p>
          <form action={saveSubjectAction} className="mt-6 space-y-4">
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
        <h2 className="font-heading text-xl font-semibold text-text">Available subjects</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {subjects.map((subject) => (
            <div key={subject.id} className="rounded-2xl border border-border bg-card p-4">
              {isAdmin ? (
                <>
                  <form action={saveSubjectAction} className="space-y-3">
                    <input type="hidden" name="id" value={subject.id} />
                    <input defaultValue={subject.name} name="name" className="w-full rounded-2xl border border-border bg-base px-3 py-2 text-sm outline-none focus:border-accent" />
                    <input defaultValue={subject.code} name="code" className="w-full rounded-2xl border border-border bg-base px-3 py-2 text-sm outline-none focus:border-accent" />
                    <button className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-white">Update</button>
                  </form>
                  <form action={deleteSubjectAction} className="mt-3">
                    <input type="hidden" name="id" value={subject.id} />
                    <button className="text-xs font-medium text-danger">Delete</button>
                  </form>
                </>
              ) : (
                <div>
                  <p className="font-medium text-text">{subject.name}</p>
                  <p className="mt-1 text-sm text-subtle">{subject.code}</p>
                </div>
              )}

              <div className="mt-4 space-y-2">
                {files
                  .filter((file) => file.subjectId === subject.id)
                  .slice(0, 4)
                  .map((file) => (
                    <div key={file.id} className="rounded-2xl bg-muted/70 px-3 py-2 text-sm text-text">
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
          ))}
        </div>
      </Panel>
    </div>
  );
}
