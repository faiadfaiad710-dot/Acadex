import { revalidatePath } from "next/cache";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { MAX_FILE_SIZE, SESSION_COOKIE_NAME } from "@/lib/constants";

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
      return Response.json({ error: "You must be signed in to publish notices." }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const profileSnapshot = await adminDb.collection("users").doc(decoded.uid).get();
    const profile = profileSnapshot.data();

    if (!profileSnapshot.exists || profile?.role !== "admin") {
      return Response.json({ error: "Only admins can publish notices." }, { status: 403 });
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return Response.json({ error: "Invalid notice form." }, { status: 400 });
    }

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return Response.json({ error: "Failed to parse notice form. Please try again." }, { status: 400 });
    }

    const text = String(formData.get("text") || "").trim();
    const file = formData.get("file");
    const hasFile = file instanceof File && file.size > 0;

    if (!text && !hasFile) {
      return Response.json({ error: "Write notice text or upload a file." }, { status: 400 });
    }

    let fileUrl = "";
    let attachmentName = "";
    let fileType = "";
    let format = "";
    let publicId = "";

    if (hasFile) {
      if (file.size > MAX_FILE_SIZE) {
        return Response.json({ error: `${file.name || "File"} is too large. Maximum size is 25MB.` }, { status: 400 });
      }

      const uploaded = await uploadToCloudinary(file, "academic-files/notices");
      fileUrl = uploaded.secure_url;
      attachmentName = file.name || uploaded.original_filename || "Notice attachment";
      fileType = file.type || "unknown";
      format = attachmentName.includes(".") ? attachmentName.split(".").pop()?.toLowerCase() || "" : "";
      publicId = uploaded.public_id;
    }

    const saved = await adminDb.collection("notices").add({
      text,
      fileUrl,
      attachmentName,
      fileType,
      format,
      resourceType: hasFile ? "raw" : "",
      publicId,
      date: new Date().toISOString(),
      uploadedBy: decoded.uid
    });

    revalidatePath("/notices");
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidatePath("/updates");

    return Response.json({ success: true, id: saved.id });
  } catch (error) {
    console.error("Notice publish failed", error);
    return Response.json({ error: error instanceof Error ? error.message : "Notice publish failed" }, { status: 500 });
  }
}
