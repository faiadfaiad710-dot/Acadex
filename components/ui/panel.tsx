import { cn } from "@/lib/utils";

export function Panel({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("glass-card rounded-[28px] border border-border/70 p-5 shadow-card", className)}>
      {children}
    </div>
  );
}
