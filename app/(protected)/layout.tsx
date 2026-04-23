import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return <AppShell role={user.role}>{children}</AppShell>;
}
