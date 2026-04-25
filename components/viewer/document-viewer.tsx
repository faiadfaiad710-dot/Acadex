"use client";

import { useRouter } from "next/navigation";

function guessPreviewKind(contentType?: string, title?: string) {
  const type = (contentType || "").toLowerCase();
  const name = (title || "").toLowerCase();
  if (type.startsWith("image/")) return "image";
  if (type.includes("pdf")) return "pdf";
  if (
    type.includes("word") ||
    type.includes("sheet") ||
    type.includes("excel") ||
    type.includes("presentation") ||
      type.includes("powerpoint")
  ) {
    return "office";
  }
  if (type.startsWith("text/")) return "text";
  if (name.match(/\.(png|jpe?g|gif|webp|bmp|svg)$/)) return "image";
  if (name.endsWith(".pdf")) return "pdf";
  if (name.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/)) return "office";
  if (name.match(/\.(txt|csv|md|json)$/)) return "text";
  return "external";
}

function getPreviewSrc(kind: string, src: string, directSrc?: string) {
  const remoteSrc = directSrc && /^https?:\/\//i.test(directSrc) ? directSrc : "";

  if (kind === "office" && remoteSrc) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(remoteSrc)}`;
  }

  if ((kind === "text" || kind === "external") && remoteSrc) {
    return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(remoteSrc)}`;
  }

  return src;
}

export function DocumentViewer({
  src,
  title,
  contentType,
  directSrc,
  downloadSrc
}: {
  src: string;
  title: string;
  contentType?: string;
  directSrc?: string;
  downloadSrc?: string;
}) {
  const router = useRouter();
  const previewKind = guessPreviewKind(contentType, title);
  const previewSrc = getPreviewSrc(previewKind, src, directSrc);
  const openSrc = previewKind === "office" || previewKind === "text" ? previewSrc : src;
  const safeDownloadSrc = downloadSrc || src;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-[28px] border border-border bg-card px-5 py-4">
        <div>
          <p className="font-heading text-lg font-semibold text-text">{title}</p>
          <p className="text-sm text-subtle">Preview inside Acadex</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
              return;
            }
            router.push("/dashboard");
          }}
          className="rounded-2xl bg-text px-4 py-2 text-sm font-medium text-base"
        >
          Close
        </button>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-border bg-card">
        {previewKind === "image" ? (
          <div className="flex h-[78vh] items-center justify-center bg-white p-4">
            <img src={src} alt={title} className="max-h-full max-w-full rounded-2xl object-contain" />
          </div>
        ) : previewKind === "pdf" ? (
          <object data={src} type="application/pdf" className="h-[78vh] w-full bg-white">
            <iframe src={src} title={title} className="h-[78vh] w-full bg-white" />
            <div className="flex h-[78vh] items-center justify-center p-6 text-center text-sm text-subtle">
              Preview is not available for this file in your browser. Open or download it in a new tab.
            </div>
          </object>
        ) : previewKind === "office" || previewKind === "text" ? (
          <div className="space-y-4 bg-white p-4">
            <iframe src={previewSrc} title={title} className="h-[72vh] w-full rounded-2xl border border-slate-200 bg-white" />
            <div className="flex flex-wrap items-center justify-center gap-3 pb-2">
              <a
                href={openSrc}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-accent px-4 py-2 text-sm font-medium text-white"
              >
                Open in new tab
              </a>
              <a
                href={safeDownloadSrc}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-text px-4 py-2 text-sm font-medium text-base"
              >
                Download
              </a>
            </div>
          </div>
        ) : (
          <div className="flex h-[78vh] flex-col items-center justify-center gap-4 bg-white p-6 text-center">
            <p className="max-w-xl text-sm text-subtle">Preview is not available inside the browser for this file type yet. You can still open it in a new tab or download it.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={openSrc}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-accent px-4 py-2 text-sm font-medium text-white"
              >
                Open file
              </a>
              <a
                href={safeDownloadSrc}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-text px-4 py-2 text-sm font-medium text-base"
              >
                Download
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
