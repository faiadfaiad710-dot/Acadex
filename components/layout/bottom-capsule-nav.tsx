"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Search, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

const capsuleLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/subjects", label: "Subject", icon: BookOpen },
  { href: "/routine", label: "Routine", icon: Table2 },
  { href: "/search", label: "Search", icon: Search }
];

export function BottomCapsuleNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 z-[70] flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 gap-1 overflow-x-auto rounded-full border border-border bg-card/95 p-1 shadow-card backdrop-blur lg:hidden">
      {capsuleLinks.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center justify-center rounded-full p-3 text-xs font-bold transition sm:p-3.5",
              active ? "bg-accent text-white" : "text-subtle hover:bg-muted hover:text-text"
            )}
            aria-label={item.label}
            title={item.label}
          >
            <Icon className="size-5" />
          </Link>
        );
      })}
    </nav>
  );
}
