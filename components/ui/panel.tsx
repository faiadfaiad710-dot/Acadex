import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";

export function Panel({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <GlassCard className={cn("p-5", className)}>{children}</GlassCard>;
}
