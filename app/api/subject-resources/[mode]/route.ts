import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { downloadFromGoogleDrive } from "@/lib/google-drive";
import { SubjectResource } from "@/lib/types";

const extensionByMime: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "text/plain; charset=utf-8": "txt",
  "text/csv": "csv",
  "application/zip": "zip",
  "application/vnd.ms-excel": "xls",
  "application/msword": "doc",
  "application/vnd.ms-powerpoint": "ppt",
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

function formatSuffix(publicId: string, format?: string) {
  const cleanFormat = String(format || "").trim().toLowerCase();
  if (!cleanFormat) return "";
  return publicId.toLowerCase().endsWith(`.${cleanFormat}`) ? "" : `.${cleanFormat}`;
}

function publicIdCandidates(resource: SubjectResource, mode: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const publicId = String(resource.publicId || "").trim();
  if (!cloudName || !publicId) {
    return [];
  }

  const resourceType = String(resource.resourceType || "raw").trim() || "raw";
  const suffix = formatSuffix(publicId, resource.format);
  const base = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${publicId}${suffix}`;
  const transformed = cloudinaryUrlForMode(base, mode);
  return Array.from(new Set([base, transformed]));
}

function filenameFromResource(resource: SubjectResource) {
  const source = resource.originalName || resource.name || "subject-file";
  const clean = source.replace(/[^\w.\- ]+/g, "").trim() || "subject-file";
  if (clean.includes(".")) return clean;
  if (resource.format) return `${clean}.${resource.format}`;
  if (resource.fileType?.includes("pdf")) return `${clean}.pdf`;
  return clean;
}

function inferContentType(resource: SubjectResource) {
  const fileType = (resource.fileType || "").toLowerCase();
  const format = (resource.format || "").toLowerCase();
  const filename = (resource.originalName || resource.name || "").toLowerCase();
  const url = (resource.fileUrl || "").toLowerCase();

  if (fileType && fileType !== "application/octet-stream" && fileType !== "unknown") return fileType;
  if (format === "pdf" || filename.endsWith(".pdf") || url.includes(".pdf")) return "application/pdf";
  if (format === "png" || filename.endsWith(".png")) return "image/png";
  if (format === "jpg" || format === "jpeg" || filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  if (format === "gif" || filename.endsWith(".gif")) return "image/gif";
  if (format === "webp" || filename.endsWith(".webp")) return "image/webp";
  if (format === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (format === "doc") return "application/msword";
  if (format === "pptx") return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (format === "ppt") return "application/vnd.ms-powerpoint";
  if (format === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (format === "xls") return "application/vnd.ms-excel";
  if (format === "txt" || filename.endsWith(".txt")) return "text/plain; charset=utf-8";
  if (format === "csv" || filename.endsWith(".csv")) return "text/csv";
  if (format === "zip" || filename.endsWith(".zip")) return "application/zip";
  return "application/octet-stream";
}

function filenameWithExtension(filename: string, contentType: string) {
  if (filename.includes(".")) return filename;
  const ext = extensionByMime[contentType];
  return ext ? `${filename}.${ext}` : filename;
}

function detectMimeFromBytes(bytes: Uint8Array) {
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "application/pdf";
  }
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
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
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return "application/zip";
  }
  return "";
}

function looksLikeMarkup(bytes: Uint8Array) {
  const sample = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, 200)).trim().toLowerCase();
  return sample.startsWith("<!doctype") || sample.startsWith("<html") || sample.startsWith("<?xml") || sample.startsWith("{\"error\"");
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ mode: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mode } = await params;
  if (!["open", "download"].includes(mode)) {
    return Response.json({ error: "Invalid resource action" }, { status: 400 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Resource id is required" }, { status: 400 });
  }

  const resourceDoc = await getAdminDb().collection("subjectResources").doc(id).get();
  if (!resourceDoc.exists) {
    return Response.json({ error: "Resource not found" }, { status: 404 });
  }

  const resource = { id: resourceDoc.id, ...resourceDoc.data() } as SubjectResource;
  if (resource.type !== "file" || !resource.fileUrl) {
    return Response.json({ error: "This resource is not a file" }, { status: 400 });
  }

  if (resource.resourceType === "drive" && resource.publicId) {
    const upstream = await downloadFromGoogleDrive(resource.publicId).catch(() => null);
    if (!upstream?.ok) {
      return Response.json({ error: "Resource could not be loaded." }, { status: 502 });
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const headers = new Headers();
    const upstreamType = upstream.headers.get("content-type") || "";
    const contentType =
      upstreamType && upstreamType !== "application/octet-stream"
        ? upstreamType
        : detectMimeFromBytes(bytes) || inferContentType(resource);
    const filename = filenameWithExtension(filenameFromResource(resource), contentType);
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "private, max-age=60");
    headers.set(
      "Content-Disposition",
      `${mode === "download" ? "attachment" : "inline"}; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );

    return new Response(arrayBuffer, { headers });
  }

  const candidates = Array.from(
    new Set([
      ...cloudinaryCandidates(resource.fileUrl, mode),
      ...publicIdCandidates(resource, mode)
    ])
  );
  const expectedType = inferContentType(resource);
  let selectedArrayBuffer: ArrayBuffer | null = null;
  let selectedContentType = "";
  for (const candidate of candidates) {
    const response = await fetch(candidate, { cache: "no-store" }).catch(() => null);
    if (!response?.ok || !response.body) {
      continue;
    }

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const upstreamType = (response.headers.get("content-type") || "").toLowerCase();
    const detectedType =
      upstreamType && upstreamType !== "application/octet-stream"
        ? upstreamType
        : detectMimeFromBytes(bytes) || expectedType;
    const isHtmlLike = upstreamType.includes("text/html") || upstreamType.includes("application/json") || looksLikeMarkup(bytes);

    if (isHtmlLike && !expectedType.startsWith("text/")) {
      continue;
    }

    selectedArrayBuffer = arrayBuffer;
    selectedContentType = detectedType;
    break;
  }

  if (!selectedArrayBuffer) {
    const fallback = candidates[0];
    if (fallback) {
      return NextResponse.redirect(fallback, { status: 307 });
    }
    return Response.json({ error: "Resource could not be loaded." }, { status: 502 });
  }

  const headers = new Headers();
  const contentType = selectedContentType || expectedType;
  const filename = filenameWithExtension(filenameFromResource(resource), contentType);
  headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "private, max-age=60");
  headers.set(
    "Content-Disposition",
    `${mode === "download" ? "attachment" : "inline"}; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
  );

  return new Response(selectedArrayBuffer, { headers });
}
