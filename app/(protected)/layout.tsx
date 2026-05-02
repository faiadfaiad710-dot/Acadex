import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/guards";
import { getLatestUnseenNotices, getUnreadNotificationCount } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [unreadNotificationCount, unseenNotices] = await Promise.all([
    getUnreadNotificationCount(user.lastSeenAt),
    getLatestUnseenNotices(user.lastSeenAt)
  ]);

  return (
    <AppShell role={user.role} unreadNotificationCount={unreadNotificationCount} unseenNotices={unseenNotices}>
      {children}
    </AppShell>
  );
}
