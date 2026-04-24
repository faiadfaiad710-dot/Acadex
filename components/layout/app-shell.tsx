"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { UserRole } from "@/lib/types";
import { LoginIntro } from "@/components/layout/login-intro";
import { BottomCapsuleNav } from "@/components/layout/bottom-capsule-nav";
import { MouseAura } from "@/components/layout/mouse-aura";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { markNotificationsSeenAction } from "@/lib/actions/auth";

function getRouteTitle(pathname: string, role: UserRole) {
  if (pathname.startsWith("/admin")) {
    return { title: "Admin Panel", subtitle: "Manage users, analytics, and academic resources." };
  }
  if (pathname.startsWith("/upload")) {
    return { title: "Upload Files", subtitle: "Upload PDFs and academic documents for students." };
  }
  if (pathname.startsWith("/subjects")) {
    return { title: "Subjects", subtitle: "Browse and manage academic subjects." };
  }
  if (pathname.startsWith("/calendar")) {
    return { title: "Calendar", subtitle: "View exam dates and academic schedule." };
  }
  if (pathname.startsWith("/notices")) {
    return { title: "Notices", subtitle: "Read and publish important announcements." };
  }
  if (pathname.startsWith("/teachers")) {
    return { title: "Teachers", subtitle: "See teachers and assigned subjects." };
  }
  if (pathname.startsWith("/labs")) {
    return { title: "Labs", subtitle: "Browse lab documents and resources." };
  }
  if (pathname.startsWith("/profile")) {
    return { title: "Profile", subtitle: "Update your password and account settings." };
  }
  return {
    title: role === "admin" ? "Admin Dashboard" : "Student Dashboard",
    subtitle: role === "admin" ? "Manage the platform from one place." : "Welcome to your Acadex workspace."
  };
}

export function AppShell({
  role,
  unreadNotificationCount,
  children
}: {
  role: UserRole;
  unreadNotificationCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(unreadNotificationCount);
  const pathname = usePathname();
  const router = useRouter();
  const routeTitle = getRouteTitle(pathname, role);

  useEffect(() => {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      }
    });
  }, [router]);

  useEffect(() => {
    setNotificationCount(unreadNotificationCount);
  }, [unreadNotificationCount]);

  useEffect(() => {
    if (notificationCount <= 0) return;
    const timer = window.setTimeout(() => {
      markNotificationsSeenAction().then(() => setNotificationCount(0)).catch(() => undefined);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [notificationCount]);

  return (
    <div className="min-h-screen px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-8">
      <MouseAura />
      <LoginIntro />
      <BottomCapsuleNav />
      <div className="mx-auto max-w-7xl">
        <div className="space-y-5">
          <Topbar
            title={routeTitle.title}
            subtitle={routeTitle.subtitle}
            onMenuClick={() => setOpen(true)}
            unreadNotificationCount={notificationCount}
          />
          {children}
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="fixed left-3 top-3 z-[60] w-[calc(100vw-1.5rem)] max-w-[340px]"
            >
              <Sidebar role={role} onNavigate={() => setOpen(false)} onClose={() => setOpen(false)} className="min-h-[calc(100vh-1.5rem)]" />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
