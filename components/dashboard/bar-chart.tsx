import { Panel } from "@/components/ui/panel";

export function BarChart({
  title,
  data
}: {
  title: string;
  data: { subject: string; total: number }[];
}) {
  const max = Math.max(...data.map((item) => item.total), 1);

  return (
    <Panel className="h-full">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-text">{title}</h3>
        <span className="text-xs text-subtle">Bar chart</span>
      </div>
      <div className="mt-6 space-y-4">
        {data.map((item) => (
          <div key={item.subject} className="space-y-2">
            <div className="flex items-center justify-between text-sm text-subtle">
              <span>{item.subject}</span>
              <span>{item.total}</span>
            </div>
            <div className="h-3 rounded-full bg-muted">
              <div
                className="h-3 rounded-full bg-accent transition-all"
                style={{ width: `${(item.total / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
