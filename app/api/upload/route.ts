import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { MAX_FILE_SIZE, SESSION_COOKIE_NAME } from "@/lib/constants";
import { uploadToCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = req.headers
      .get("cookie")
      ?.split(";")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`))
      ?.slice(SESSION_COOKIE_NAME.length + 1);

    if (!session) {
      return Response.json({ error: "You must be signed in to upload files." }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const profileSnapshot = await adminDb.collection("users").doc(decoded.uid).get();
    const profile = profileSnapshot.data();

    if (!profileSnapshot.exists || profile?.role !== "admin") {
      return Response.json({ error: "Only admins can upload files." }, { status: 403 });
    }

    const contentType = req.headers.get("content-type") || "";
    let title = "";
    let subjectId = "";
    let subjectName = "";
    let files: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData().catch(() => null);
      if (!formData) {
        return Response.json({ error: "Failed to parse upload form. Please try again." }, { status: 400 });
      }

      title = String(formData.get("title") || "").trim();
      subjectId = String(formData.get("subjectId") || "").trim();
      subjectName = String(formData.get("subjectName") || "").trim();
      files = formData
        .getAll("files")
        .filter((item): item is File => item instanceof File && item.size > 0);
      const singleFile = formData.get("file");
      if (!files.length && singleFile instanceof File && singleFile.size > 0) {
        files.push(singleFile);
      }
    } else {
      const body = (await req.json().catch(() => null)) as
        | {
            title?: string;
            subjectId?: string;
            subjectName?: string;
          }
        | null;

      title = String(body?.title || "").trim();
      subjectId = String(body?.subjectId || "").trim();
      subjectName = String(body?.subjectName || "").trim();
    }

    if (!files.length) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (!subjectId || !subjectName) {
      return Response.json({ error: "Missing upload details." }, { status: 400 });
    }

    const uploadedFiles: Array<{
      id: string;
      url: string;
      publicId: string;
      resourceType: string;
      format: string;
    }> = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return Response.json({ error: `${file.name} is too large.` }, { status: 400 });
      }

      const result = await uploadToCloudinary(file, "academic-files/files");
      const finalTitle = title ? `${title} - ${file.name}` : file.name;
      const saved = await adminDb.collection("files").add({
        title: finalTitle,
        originalName: file.name || finalTitle,
        fileUrl: result.secure_url,
        publicId: result.public_id,
        resourceType: "raw",
        format: file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() || "" : "",
        subjectId,
        subjectName,
        uploadDate: new Date().toISOString(),
        uploadedBy: decoded.uid,
        fileType: file.type || "unknown",
        fileSize: file.size
      });

      uploadedFiles.push({
        id: saved.id,
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: "raw",
        format: file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() || "" : ""
      });
    }

    return Response.json({
      count: uploadedFiles.length,
      files: uploadedFiles
    });
  } catch (error) {
    console.error("Upload failed", error);
    return Response.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 });
  }
}
