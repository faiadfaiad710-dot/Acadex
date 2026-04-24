import Link from "next/link";
import {
  deleteSubjectResourceAction,
  deleteSubjectSectionAction,
  saveSubjectResourceAction,
  saveSubjectSectionAction
} from "@/lib/actions/admin";
import { requireUser } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { getAllFiles, getAllSubjectResources, getAllSubjectSections, getAllSubjects, getAllTeachers } from "@/lib/data";
import { SubjectDetailView } from "@/components/subjects/subject-detail-view";

export default async function SubjectDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string; node?: string | string[] }>;
}) {
  await requireUser();
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const initialOpenSectionId = String(resolvedSearchParams.section || "");
  const initialOpenResourceIds = Array.isArray(resolvedSearchParams.node)
    ? resolvedSearchParams.node.map(String).filter(Boolean)
    : resolvedSearchParams.node
      ? [String(resolvedSearchParams.node)]
      : [];
  const [user, subjects, sections, resources, files, teachers] = await Promise.all([
    getCurrentUser(),
    getAllSubjects(),
    getAllSubjectSections(),
    getAllSubjectResources(),
    getAllFiles(),
    getAllTeachers()
  ]);

  const subject = subjects.find((item) => item.id === id);
  if (!subject) {
    return <div className="rounded-[28px] border border-border bg-card p-6 text-sm text-subtle">Subject not found.</div>;
  }

  return (
    <div className="space-y-5">
      <Link href="/subjects" className="inline-flex rounded-2xl border border-border bg-card px-4 py-2 text-sm font-medium text-text">
        Back to subjects
      </Link>
      <SubjectDetailView
        subject={subject}
        sections={sections.filter((section) => section.subjectId === subject.id)}
        resources={resources.filter((resource) => resource.subjectId === subject.id)}
        legacyFiles={files.filter((file) => file.subjectId === subject.id).map((file) => ({ id: file.id, title: file.title }))}
        teachers={teachers}
        isAdmin={user?.role === "admin"}
        initialOpenSectionId={initialOpenSectionId}
        initialOpenResourceIds={initialOpenResourceIds}
        saveSubjectSectionAction={saveSubjectSectionAction}
        saveSubjectResourceAction={saveSubjectResourceAction}
        deleteSubjectSectionAction={deleteSubjectSectionAction}
        deleteSubjectResourceAction={deleteSubjectResourceAction}
      />
    </div>
  );
}
