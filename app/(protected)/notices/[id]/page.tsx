import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { getAdminDb } from "@/lib/firebase/admin";
import { DocumentViewer } from "@/components/viewer/document-viewer";
import { getNoticeDownloadHref } from "@/lib/utils";

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const noticeDoc = await getAdminDb().collection("notices").doc(id).get();

  if (!noticeDoc.exists) {
    return <div className="rounded-[28px] border border-border bg-card p-6 text-sm text-subtle">Notice not found.</div>;
  }

  const notice = noticeDoc.data() as { text?: string; fileUrl?: string; attachmentName?: string; fileType?: string; format?: string };

  return (
    <div className="space-y-5">
      <Link href="/notices" className="inline-flex rounded-2xl border border-border bg-card px-4 py-2 text-sm font-medium text-text">
        Back to notices
      </Link>

      <div className="rounded-[28px] border border-border bg-card p-6">
        <h2 className="font-heading text-2xl font-bold text-text">Notice</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm text-subtle">{notice.text || "Attachment-only notice"}</p>
      </div>

      {notice.fileUrl ? (
        <>
          <div className="flex gap-3">
            <a href={getNoticeDownloadHref(id)} target="_blank" rel="noreferrer" className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white">
              Download attachment
            </a>
          </div>
          <DocumentViewer
            src={`/api/notices/open?id=${encodeURIComponent(id)}`}
            title={notice.attachmentName || "Notice attachment"}
            contentType={notice.fileType || notice.format}
          />
        </>
      ) : null}
    </div>
  );
}
