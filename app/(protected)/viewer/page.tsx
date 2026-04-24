import { requireUser } from "@/lib/auth/guards";
import { getAdminDb } from "@/lib/firebase/admin";
import { DocumentViewer } from "@/components/viewer/document-viewer";

export default async function ViewerPage({
  searchParams
}: {
  searchParams: Promise<{ id?: string; type?: string }>;
}) {
  await requireUser();
  const { id = "", type = "file" } = await searchParams;

  if (!id) {
    return <div className="rounded-[28px] border border-border bg-card p-6 text-sm text-subtle">No file selected.</div>;
  }

  if (type === "notice") {
    const noticeDoc = await getAdminDb().collection("notices").doc(id).get();
    if (!noticeDoc.exists) {
      return <div className="rounded-[28px] border border-border bg-card p-6 text-sm text-subtle">Notice not found.</div>;
    }

    const data = noticeDoc.data() as { text?: string; attachmentName?: string; fileType?: string; format?: string };
    return (
      <DocumentViewer
        src={`/api/notices/open?id=${encodeURIComponent(id)}`}
        title={data.attachmentName || data.text || "Notice viewer"}
        contentType={data.fileType || data.format}
      />
    );
  }

  if (type === "resource") {
    const resourceDoc = await getAdminDb().collection("subjectResources").doc(id).get();
    if (!resourceDoc.exists) {
      return <div className="rounded-[28px] border border-border bg-card p-6 text-sm text-subtle">Resource not found.</div>;
    }

    const data = resourceDoc.data() as { name?: string; fileType?: string; format?: string; originalName?: string };
    return (
      <DocumentViewer
        src={`/api/subject-resources/open?id=${encodeURIComponent(id)}`}
        title={data.originalName || data.name || "Resource viewer"}
        contentType={data.fileType || data.format}
      />
    );
  }

  const fileDoc = await getAdminDb().collection("files").doc(id).get();
  if (!fileDoc.exists) {
    return <div className="rounded-[28px] border border-border bg-card p-6 text-sm text-subtle">File not found.</div>;
  }

  const data = fileDoc.data() as { title?: string; originalName?: string; fileType?: string; format?: string };

  return (
    <DocumentViewer
      src={`/api/files/open?id=${encodeURIComponent(id)}`}
      title={data.originalName || data.title || "Document viewer"}
      contentType={data.fileType || data.format}
    />
  );
}
