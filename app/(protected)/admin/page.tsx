import { BarChart } from "@/components/dashboard/bar-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { Panel } from "@/components/ui/panel";
import { createUserAction, deleteUserAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { getAdminStats, getAllUsers } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function AdminPage() {
  const currentAdmin = await requireAdmin();
  const [stats, users] = await Promise.all([getAdminStats(), getAllUsers()]);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-3">
        <StatCard label="Total files" value={stats.totalFiles} helper="All uploaded academic files" />
        <StatCard label="Total subjects" value={stats.totalSubjects} helper="Subjects available for assignment" />
        <StatCard label="Total users" value={stats.totalUsers} helper="Admin and student accounts" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <BarChart title="Files per subject" data={stats.filesPerSubject} />
        <Panel>
          <h3 className="font-heading text-lg font-semibold text-text">Create user</h3>
          <p className="mt-2 text-sm text-subtle">Create users here so Acadex updates both Firebase Authentication and the Firestore users collection automatically.</p>
          <form action={createUserAction} className="mt-4 space-y-4">
            <input name="phone" type="tel" placeholder="Student phone number" required className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
            <input name="email" type="email" placeholder="Admin email only if creating admin" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
            <input name="password" type="text" placeholder="Temporary password" required className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent" />
            <select name="role" className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button className="w-full rounded-2xl bg-accent px-4 py-3 font-medium text-white transition hover:opacity-90">Create account</button>
          </form>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel>
          <h3 className="font-heading text-lg font-semibold text-text">Recent uploads</h3>
          <div className="mt-4 space-y-3">
            {stats.recentUploads.map((file) => (
              <a key={file.id} href={file.fileUrl} target="_blank" rel="noreferrer" className="block rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-text">{file.title}</p>
                    <p className="text-sm text-subtle">{file.subjectName}</p>
                  </div>
                  <span className="text-xs text-subtle">{formatDate(file.uploadDate)}</span>
                </div>
              </a>
            ))}
          </div>
        </Panel>

        <Panel>
          <h3 className="font-heading text-lg font-semibold text-text">User accounts</h3>
          <div className="mt-4 space-y-3">
            {users.map((user) => (
              <div key={user.uid} className="rounded-2xl border border-border bg-card p-4">
                <p className="font-medium text-text">{user.phone || user.loginId || user.email}</p>
                <p className="mt-1 text-xs text-subtle">{user.email}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-subtle">
                  <span>{user.role}</span>
                  <span>{user.mustChangePassword ? "Needs password reset" : "Active"}</span>
                </div>
                {user.uid !== currentAdmin.uid ? (
                  <form action={deleteUserAction} className="mt-3">
                    <input type="hidden" name="uid" value={user.uid} />
                    <button className="text-xs font-medium text-danger">Delete user</button>
                  </form>
                ) : (
                  <p className="mt-3 text-xs font-medium text-subtle">Current admin</p>
                )}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
