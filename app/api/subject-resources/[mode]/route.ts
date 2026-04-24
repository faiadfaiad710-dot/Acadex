import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { SubjectResource } from "@/lib/types";

const extensionByMime: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
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

  let upstream: Response | null = null;
  for (const candidate of cloudinaryCandidates(resource.fileUrl, mode)) {
    const response = await fetch(candidate, { cache: "no-store" }).catch(() => null);
    if (response?.ok && response.body) {
      upstream = response;
      break;
    }
  }

  if (!upstream?.ok || !upstream.body) {
    return Response.json({ error: "Resource could not be loaded." }, { status: 502 });
  }

  const headers = new Headers();
  const upstreamType = upstream.headers.get("content-type") || "";
  const contentType = upstreamType && upstreamType !== "application/octet-stream" ? upstreamType : inferContentType(resource);
  const filename = filenameWithExtension(filenameFromResource(resource), contentType);
  headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "private, max-age=60");
  headers.set(
    "Content-Disposition",
    `${mode === "download" ? "attachment" : "inline"}; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
  );

  return new Response(upstream.body, { headers });
}
