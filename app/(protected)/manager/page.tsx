import Link from "next/link";
import { BookOpen, CalendarDays, Table2, Upload } from "lucide-react";
import { requireAdminOrManager } from "@/lib/auth/guards";
import { getAllClassRoutines, getAllExams, getAllSubjectResources, getAllSubjects } from "@/lib/data";
import { Panel } from "@/components/ui/panel";

const managerActions = [
  {
    href: "/subjects",
    title: "Subject resources",
    description: "Open any subject to create sections, folders, and upload academic files.",
    icon: BookOpen
  },
  {
    href: "/upload",
    title: "Quick upload",
    description: "Upload academic documents and assign them to a subject.",
    icon: Upload
  },
  {
    href: "/routine",
    title: "Class routine",
    description: "Add or update class times, teachers, rooms, and notes.",
    icon: Table2
  },
  {
    href: "/calendar",
    title: "Calendar events",
    description: "Add upcoming exam dates and academic events for students.",
    icon: CalendarDays
  }
];

export default async function ManagerPage() {
  await requireAdminOrManager();
  const [subjects, resources, routines, exams] = await Promise.all([
    getAllSubjects(),
    getAllSubjectResources(),
    getAllClassRoutines(),
    getAllExams()
  ]);

  return (
    <div className="space-y-5">
      <Panel className="rounded-[32px] p-6">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-subtle">Manager access</p>
        <h2 className="mt-3 font-heading text-3xl font-black text-text">Manager Panel</h2>
        <p className="mt-2 max-w-2xl text-sm text-subtle">
          Managers keep the same student-facing profile and dashboard, with this extra panel for uploads, routine updates,
          calendar events, and subject resources.
        </p>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Panel>
          <p className="text-sm text-subtle">Subjects</p>
          <p className="mt-2 text-3xl font-black text-text">{subjects.length}</p>
        </Panel>
        <Panel>
          <p className="text-sm text-subtle">Subject files</p>
          <p className="mt-2 text-3xl font-black text-text">{resources.filter((item) => item.type === "file").length}</p>
        </Panel>
        <Panel>
          <p className="text-sm text-subtle">Routine classes</p>
          <p className="mt-2 text-3xl font-black text-text">{routines.length}</p>
        </Panel>
        <Panel>
          <p className="text-sm text-subtle">Upcoming events</p>
          <p className="mt-2 text-3xl font-black text-text">{exams.length}</p>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {managerActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href} className="group block">
              <Panel className="h-full transition duration-200 group-hover:-translate-y-1 group-hover:border-accent/50 group-hover:shadow-glow">
                <div className="flex items-start gap-4">
                  <span className="rounded-2xl bg-accentSoft p-3 text-accent">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-text">{action.title}</h3>
                    <p className="mt-2 text-sm text-subtle">{action.description}</p>
                  </div>
                </div>
              </Panel>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
