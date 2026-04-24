import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { Notice } from "@/lib/types";

const extensionByMime: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "text/plain; charset=utf-8": "txt",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx"
};

function cloudinaryUrlForMode(url: string, mode: string) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  const flag = mode === "download" ? "fl_attachment" : "fl_inline";
  return url.replace("/upload/", `/upload/${flag}/`);
}

function cloudinaryCandidates(url: string, mode: string) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return [url];
  }

  const rawUrl = url.replace("/image/upload/", "/raw/upload/").replace("/auto/upload/", "/raw/upload/");
  const transformed = cloudinaryUrlForMode(url, mode);
  const rawTransformed = cloudinaryUrlForMode(rawUrl, mode);

  return Array.from(new Set([url, transformed, rawUrl, rawTransformed]));
}

function filenameFromNotice(notice: Notice) {
  const source = notice.attachmentName || "notice-file";
  const clean = source.replace(/[^\w.\- ]+/g, "").trim() || "notice-file";
  if (clean.includes(".")) return clean;
  if (notice.format) return `${clean}.${notice.format}`;
  if (notice.fileType?.includes("pdf")) return `${clean}.pdf`;
  return clean;
}

function inferContentType(notice: Notice) {
  const fileType = (notice.fileType || "").toLowerCase();
  const format = (notice.format || "").toLowerCase();
  const filename = (notice.attachmentName || "").toLowerCase();
  const url = (notice.fileUrl || "").toLowerCase();

  if (fileType && fileType !== "application/octet-stream" && fileType !== "unknown") return fileType;
  if (format === "pdf" || filename.endsWith(".pdf") || url.includes(".pdf")) return "application/pdf";
  if (format === "png" || filename.endsWith(".png")) return "image/png";
  if (format === "jpg" || format === "jpeg" || filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  if (format === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (format === "doc") return "application/msword";
  if (format === "pptx") return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (format === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (format === "txt" || filename.endsWith(".txt")) return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

function filenameWithExtension(filename: string, contentType: string) {
  if (filename.includes(".")) return filename;
  const ext = extensionByMime[contentType];
  return ext ? `${filename}.${ext}` : filename;
}

function detectMimeFromBytes(bytes: Uint8Array) {
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return "application/pdf";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46
  ) {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return "";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ mode: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mode } = await params;
  if (!["open", "download"].includes(mode)) {
    return Response.json({ error: "Invalid notice action" }, { status: 400 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Notice id is required" }, { status: 400 });
  }

  const noticeDoc = await getAdminDb().collection("notices").doc(id).get();
  if (!noticeDoc.exists) {
    return Response.json({ error: "Notice not found" }, { status: 404 });
  }

  const notice = { id: noticeDoc.id, ...noticeDoc.data() } as Notice;
  if (!notice.fileUrl) {
    return Response.json({ error: "This notice has no file" }, { status: 400 });
  }

  let upstream: Response | null = null;
  for (const candidate of cloudinaryCandidates(notice.fileUrl, mode)) {
    const response = await fetch(candidate, { cache: "no-store" }).catch(() => null);
    if (response?.ok && response.body) {
      upstream = response;
      break;
    }
  }

  if (!upstream?.ok || !upstream.body) {
    return Response.json({ error: "Notice file could not be loaded." }, { status: 502 });
  }

  const arrayBuffer = await upstream.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const headers = new Headers();
  const upstreamType = upstream.headers.get("content-type") || "";
  const contentType =
    upstreamType && upstreamType !== "application/octet-stream"
      ? upstreamType
      : detectMimeFromBytes(bytes) || inferContentType(notice);
  const filename = filenameWithExtension(filenameFromNotice(notice), contentType);
  headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "private, max-age=60");
  headers.set(
    "Content-Disposition",
    `${mode === "download" ? "attachment" : "inline"}; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
  );

  return new Response(arrayBuffer, { headers });
}
