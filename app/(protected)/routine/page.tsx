import { Clock, MapPin, Pencil, Trash2, UserRound } from "lucide-react";
import { deleteClassRoutineAction, saveClassRoutineAction } from "@/lib/actions/admin";
import { requireUser } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { getAllClassRoutines, getAllSubjects, getAllTeachers } from "@/lib/data";
import { Panel } from "@/components/ui/panel";
import { RoutineForm } from "@/components/routine/routine-form";
import { ClassRoutine } from "@/lib/types";

const days: Array<[ClassRoutine["day"], string]> = [
  ["saturday", "Saturday"],
  ["sunday", "Sunday"],
  ["monday", "Monday"],
  ["tuesday", "Tuesday"],
  ["wednesday", "Wednesday"],
  ["thursday", "Thursday"],
  ["friday", "Friday"]
];

export default async function RoutinePage() {
  await requireUser();
  const [user, subjects, routines, teachers] = await Promise.all([getCurrentUser(), getAllSubjects(), getAllClassRoutines(), getAllTeachers()]);
  const isAdmin = user?.role === "admin";
  const canManageRoutine = isAdmin || user?.role === "manager";

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      {canManageRoutine ? (
        <Panel>
          <h2 className="font-heading text-xl font-semibold text-text">Add class routine</h2>
          <p className="mt-2 text-sm text-subtle">Admins and managers can add classes by subject, day, time, room, and teacher.</p>
          <RoutineForm subjects={subjects} teachers={teachers} action={saveClassRoutineAction} />
        </Panel>
      ) : null}

      <Panel className={canManageRoutine ? "" : "xl:col-span-2"}>
        <h2 className="font-heading text-xl font-semibold text-text">Class routine</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {days.map(([day, label]) => {
            const dayRoutines = routines.filter((routine) => routine.day === day);
            return (
              <section key={day} className="rounded-2xl border border-border bg-card p-4">
                <h3 className="font-heading text-lg font-semibold text-text">{label}</h3>
                <div className="mt-4 space-y-3">
                  {dayRoutines.length ? (
                    dayRoutines.map((routine) => (
                      <div key={routine.id} className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-text">{routine.subjectName}</p>
                            <p className="mt-1 flex items-center gap-2 text-sm text-subtle">
                              <Clock className="size-4" />
                              {routine.startTime}
                              {routine.endTime ? ` - ${routine.endTime}` : ""}
                            </p>
                            {routine.room ? (
                              <p className="mt-1 flex items-center gap-2 text-sm text-subtle">
                                <MapPin className="size-4" />
                                {routine.room}
                              </p>
                            ) : null}
                            {routine.teacherName ? (
                              <p className="mt-1 flex items-center gap-2 text-sm text-subtle">
                                <UserRound className="size-4" />
                                {routine.teacherName}
                              </p>
                            ) : null}
                            {routine.note ? <p className="mt-2 text-sm text-subtle">{routine.note}</p> : null}
                          </div>
                          {canManageRoutine ? (
                            <div className="flex items-center gap-2">
                              <a href={`#edit-${routine.id}`} className="rounded-xl border border-border bg-card p-2 text-text" aria-label="Edit class">
                                <Pencil className="size-4" />
                              </a>
                              {isAdmin ? (
                                <form action={deleteClassRoutineAction}>
                                  <input type="hidden" name="id" value={routine.id} />
                                  <button className="rounded-xl border border-danger/30 bg-danger/10 p-2 text-danger" aria-label="Delete class">
                                    <Trash2 className="size-4" />
                                  </button>
                                </form>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        {canManageRoutine ? (
                          <details id={`edit-${routine.id}`} className="mt-4 rounded-2xl border border-border bg-card p-3">
                            <summary className="cursor-pointer text-sm font-semibold text-text">Update this class</summary>
                            <RoutineForm subjects={subjects} teachers={teachers} routine={routine} action={saveClassRoutineAction} compact />
                          </details>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-subtle">
                      No class added.
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
