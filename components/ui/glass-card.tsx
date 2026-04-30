import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}
