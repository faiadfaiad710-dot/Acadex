"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, FlaskConical, LayoutDashboard, Megaphone, ShieldCheck, Upload, Users2, UserRoundCog, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/lib/types";
import { useAppConfig } from "@/providers/app-providers";

const navItems: Array<{
  href: string;
  labelKey: "dashboard" | "adminPanel" | "upload" | "subjects" | "calendar" | "notices" | "teachers" | "labs" | "profile";
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}> = [
  { href: "/dashboard", labelKey: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["user", "admin"] },
  { href: "/admin", labelKey: "adminPanel", label: "Admin Panel", icon: ShieldCheck, roles: ["admin"] },
  { href: "/upload", labelKey: "upload", label: "Upload", icon: Upload, roles: ["admin"] },
  { href: "/subjects", labelKey: "subjects", label: "Subjects", icon: BookOpen, roles: ["admin", "user"] },
  { href: "/calendar", labelKey: "calendar", label: "Calendar", icon: CalendarDays, roles: ["admin", "user"] },
  { href: "/notices", labelKey: "notices", label: "Notices", icon: Megaphone, roles: ["admin", "user"] },
  { href: "/teachers", labelKey: "teachers", label: "Teachers", icon: Users2, roles: ["admin", "user"] },
  { href: "/labs", labelKey: "labs", label: "Labs", icon: FlaskConical, roles: ["admin", "user"] },
  { href: "/profile", labelKey: "profile", label: "Profile", icon: UserRoundCog, roles: ["admin", "user"] }
];

export function Sidebar({
  role,
  className,
  onNavigate,
  onClose
}: {
  role: UserRole;
  className?: string;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { dictionary } = useAppConfig();
  const visibleItems =
    role === "admin"
      ? navItems
      : navItems.filter((item) => item.href !== "/admin" && item.href !== "/upload");

  return (
    <aside className={cn("glass-card flex h-full flex-col rounded-[32px] border border-border/70 p-5 shadow-card", className)}>
      <div className="mb-8 flex items-start justify-between gap-3">
        <div>
          <p className="brand-gradient font-heading text-4xl font-black tracking-tight">Acadex</p>
          <p className="mt-2 text-sm text-subtle">{role === "admin" ? "Administrator workspace" : "Student workspace"}</p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-border bg-card p-3 text-text transition hover:border-accent hover:text-accent"
            aria-label="Close navigation menu"
          >
            <X className="size-5" />
          </button>
        ) : null}
      </div>
      <div className="mb-3 rounded-2xl bg-muted/70 px-4 py-3">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-subtle">Sections</p>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
        {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            const label = dictionary[item.labelKey as keyof typeof dictionary] || item.label;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                  active
                    ? "border-accent bg-accent text-white shadow-lg"
                    : "border-border/70 bg-card/70 text-text hover:border-accent/40 hover:bg-muted"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}
