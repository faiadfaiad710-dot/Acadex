import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { MAX_FILE_SIZE, SESSION_COOKIE_NAME } from "@/lib/constants";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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

    const formData = await req.formData();
    const title = String(formData.get("title") || "").trim();
    const subjectId = String(formData.get("subjectId") || "").trim();
    const subjectName = String(formData.get("subjectName") || "").trim();
    const files = formData
      .getAll("files")
      .filter((item): item is File => item instanceof File && item.size > 0);
    const singleFile = formData.get("file");
    if (!files.length && singleFile instanceof File && singleFile.size > 0) {
      files.push(singleFile);
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
      publicId?: string;
      resourceType?: string;
      format?: string;
    }> = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return Response.json({ error: `${file.name} is too large.` }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ resource_type: "raw", folder: "academic-files/files" }, (error, uploadResult) => {
            if (error || !uploadResult) {
              reject(error ?? new Error("Upload failed"));
              return;
            }

            resolve(uploadResult);
          })
          .end(buffer);
      });

      const finalTitle = title ? `${title} - ${file.name}` : file.name;
      const saved = await adminDb.collection("files").add({
        title: finalTitle,
        originalName: file.name || finalTitle,
        fileUrl: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format ?? "",
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
        resourceType: result.resource_type,
        format: result.format
      });
    }

    return Response.json({
      count: uploadedFiles.length,
      files: uploadedFiles
    });
  } catch (error) {
    console.error("Upload failed", error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
