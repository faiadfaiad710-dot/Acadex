import {
  getAllFiles,
  getAllLabs,
  getAllNotices,
  getAllSubjectResources,
  getAllSubjects,
  getAllTeachers
} from "@/lib/data";
import { requireUser } from "@/lib/auth/guards";
import { SearchPanel } from "@/components/dashboard/search-panel";
import { Panel } from "@/components/ui/panel";

export default async function SearchPage() {
  await requireUser();
  const [files, subjects, notices, labs, teachers, resources] = await Promise.all([
    getAllFiles(),
    getAllSubjects(),
    getAllNotices(),
    getAllLabs(),
    getAllTeachers(),
    getAllSubjectResources()
  ]);

  return (
    <Panel className="rounded-[32px] p-5 sm:p-6">
      <SearchPanel
        files={files}
        subjects={subjects}
        notices={notices}
        labs={labs}
        teachers={teachers}
        resources={resources}
      />
    </Panel>
  );
}
