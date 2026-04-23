import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { FileRecord } from "@/lib/types";

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

function filenameFromRecord(file: FileRecord) {
  const cleanTitle = file.title.replace(/[^\w.\- ]+/g, "").trim() || "academic-file";
  if (cleanTitle.includes(".")) return cleanTitle;
  if (file.format) return `${cleanTitle}.${file.format}`;
  if (file.fileType?.includes("pdf")) return `${cleanTitle}.pdf`;
  return cleanTitle;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ mode: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mode } = await params;
  if (!["open", "download"].includes(mode)) {
    return Response.json({ error: "Invalid file action" }, { status: 400 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return Response.json({ error: "File id is required" }, { status: 400 });
  }

  const fileDoc = await getAdminDb().collection("files").doc(id).get();
  if (!fileDoc.exists) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  const file = { id: fileDoc.id, ...fileDoc.data() } as FileRecord;
  let upstream: Response | null = null;
  for (const candidate of cloudinaryCandidates(file.fileUrl, mode)) {
    const response = await fetch(candidate, { cache: "no-store" }).catch(() => null);
    if (response?.ok && response.body) {
      upstream = response;
      break;
    }
  }

  if (!upstream?.ok || !upstream.body) {
    return Response.json(
      {
        error: "File could not be loaded. Re-upload this PDF once; new PDF uploads are now stored in Cloudinary raw mode."
      },
      { status: 502 }
    );
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type") || file.fileType || "application/octet-stream";
  headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "private, max-age=60");
  headers.set(
    "Content-Disposition",
    `${mode === "download" ? "attachment" : "inline"}; filename="${filenameFromRecord(file)}"`
  );

  return new Response(upstream.body, { headers });
}
