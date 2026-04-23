import { deleteLabAction, saveLabAction } from "@/lib/actions/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { requireUser } from "@/lib/auth/guards";
import { getAllLabs, getAllSubjects } from "@/lib/data";
import { Panel } from "@/components/ui/panel";
import { formatDate, getDownloadUrl } from "@/lib/utils";

export default async function LabsPage() {
  await requireUser();
  const [labs, subjects, user] = await Promise.all([getAllLabs(), getAllSubjects(), getCurrentUser()]);
  const isAdmin = user?.role === "admin";

  return (
    <div className="grid gap-5 xl:grid-cols-[430px_1fr]">
      {isAdmin ? (
        <Panel>
          <h2 className="font-heading text-xl font-semibold text-text">Lab section</h2>
          <p className="mt-2 text-sm text-subtle">Add lab titles, descriptions, and upload supporting lab documents.</p>

          <form action={saveLabAction} className="mt-6 space-y-4">
            <input name="title" placeholder="Lab title" required className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
            <textarea name="description" rows={4} placeholder="Description" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
            <select name="subjectId" required className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent">
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            <input type="hidden" name="subjectName" value="" />
            <input name="file" type="file" className="w-full rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-sm" />
            <button className="w-full rounded-2xl bg-accent px-4 py-3 font-medium text-white transition hover:opacity-90">Save lab</button>
          </form>
        </Panel>
      ) : null}

      <Panel>
        <h2 className="font-heading text-xl font-semibold text-text">Lab resources</h2>
        <div className="mt-5 grid gap-3">
          {labs.map((lab) => (
            <div key={lab.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-text">{lab.title}</p>
                  <p className="text-sm text-subtle">{lab.subjectName}</p>
                  {lab.description ? <p className="mt-2 text-sm text-subtle">{lab.description}</p> : null}
                </div>
                <div className="text-xs text-subtle">
                  <p>{formatDate(lab.date)}</p>
                  {lab.fileUrl ? (
                    <div className="mt-2 flex gap-3 font-medium">
                      <a href={lab.fileUrl} target="_blank" rel="noreferrer" className="text-accent">
                        Open
                      </a>
                      <a href={getDownloadUrl(lab.fileUrl)} download className="text-accent">
                        Download
                      </a>
                    </div>
                  ) : null}
                  {isAdmin ? (
                    <form action={deleteLabAction} className="mt-2">
                      <input type="hidden" name="id" value={lab.id} />
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
  );
}
