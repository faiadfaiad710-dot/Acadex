import { ArrowUpRight } from "lucide-react";
import { Panel } from "@/components/ui/panel";

export function StatCard({
  label,
  value,
  helper
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-subtle">{label}</p>
          <h3 className="mt-3 font-heading text-3xl font-bold text-text">{value}</h3>
          <p className="mt-2 text-sm text-subtle">{helper}</p>
        </div>
        <div className="rounded-2xl bg-accentSoft p-3 text-accent">
          <ArrowUpRight className="size-5" />
        </div>
      </div>
    </Panel>
  );
}
