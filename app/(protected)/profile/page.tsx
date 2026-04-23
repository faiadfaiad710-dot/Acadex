import { PasswordCard } from "@/components/auth/password-card";
import { requireUser } from "@/lib/auth/guards";
import { Panel } from "@/components/ui/panel";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <PasswordCard mustChangePassword={user.mustChangePassword} />
      <Panel>
        <h2 className="font-heading text-xl font-semibold text-text">Account overview</h2>
        <dl className="mt-6 space-y-4">
          <div>
            <dt className="text-xs uppercase tracking-[0.25em] text-subtle">Email</dt>
            <dd className="mt-1 text-sm text-text">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.25em] text-subtle">Role</dt>
            <dd className="mt-1 text-sm text-text">{user.role}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.25em] text-subtle">Password status</dt>
            <dd className="mt-1 text-sm text-text">{user.mustChangePassword ? "Update required" : "Up to date"}</dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}
