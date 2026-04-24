"use client";

import { useRouter } from "next/navigation";

function guessPreviewKind(contentType?: string) {
  const type = (contentType || "").toLowerCase();
  if (type.startsWith("image/")) return "image";
  if (type.includes("pdf")) return "pdf";
  return "embed";
}

export function DocumentViewer({
  src,
  title,
  contentType
}: {
  src: string;
  title: string;
  contentType?: string;
}) {
  const router = useRouter();
  const previewKind = guessPreviewKind(contentType);

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
        ) : (
          <iframe src={src} title={title} className="h-[78vh] w-full bg-white" />
        )}
      </div>
    </div>
  );
}
