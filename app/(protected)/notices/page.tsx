import Link from "next/link";
import { deleteNoticeAction } from "@/lib/actions/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { requireUser } from "@/lib/auth/guards";
import { getAllNotices } from "@/lib/data";
import { Panel } from "@/components/ui/panel";
import { formatDate, getNoticeDownloadHref } from "@/lib/utils";
import { NoticeForm } from "@/components/notices/notice-form";

export default async function NoticesPage() {
  await requireUser();
  const [notices, user] = await Promise.all([getAllNotices(), getCurrentUser()]);
  const isAdmin = user?.role === "admin";

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      {isAdmin ? (
        <Panel>
          <h2 className="font-heading text-xl font-semibold text-text">Post notice</h2>
          <NoticeForm />
        </Panel>
      ) : null}

      <Panel>
        <h2 className="font-heading text-xl font-semibold text-text">Notice board</h2>
        <div className="mt-5 space-y-3">
          {notices.map((notice) => (
            <div key={notice.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm text-text">{notice.text || "Notice"}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-subtle">
                <span>{formatDate(notice.date)}</span>
                {notice.fileUrl ? (
                  <>
                    <Link href={`/notices/${notice.id}`} className="font-medium text-accent">
                      Open in website
                    </Link>
                    <a href={getNoticeDownloadHref(notice.id)} target="_blank" rel="noreferrer" className="font-medium text-accent">
                      Download
                    </a>
                  </>
                ) : null}
                {isAdmin ? (
                  <form action={deleteNoticeAction}>
                    <input type="hidden" name="id" value={notice.id} />
                    <button className="font-medium text-danger">Delete</button>
                  </form>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
