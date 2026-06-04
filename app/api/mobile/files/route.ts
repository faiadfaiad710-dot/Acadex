import { v2 as cloudinary } from "cloudinary";
import { revalidatePath } from "next/cache";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function getMobileUser(req: Request) {
  const authorization = req.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return null;

  const decoded = await getAdminAuth().verifyIdToken(token).catch(() => null);
  if (!decoded) return null;

  const profileDoc = await getAdminDb().collection("users").doc(decoded.uid).get();
  if (!profileDoc.exists) return null;

  return {
    uid: decoded.uid,
    role: String(profileDoc.data()?.role || "user")
  };
}

async function destroyCloudinaryAsset(publicId?: string) {
  if (!publicId) return;

  const candidates = [
    { resource_type: "raw" },
    { resource_type: "image" },
    { resource_type: "video" }
  ];

  for (const options of candidates) {
    const result = await cloudinary.uploader.destroy(publicId, options).catch(() => null);
    if (result?.result === "ok" || result?.result === "not found") return;
  }
}

export async function DELETE(req: Request) {
  const user = await getMobileUser(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return Response.json({ error: "Only admins can delete files from the website." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind");
  const id = searchParams.get("id");

  if (!id || !kind) {
    return Response.json({ error: "Missing file id." }, { status: 400 });
  }

  const collectionName =
    kind === "file" ? "files" : kind === "resource" ? "subjectResources" : kind === "notice" ? "notices" : "";
  if (!collectionName) {
    return Response.json({ error: "Invalid file kind." }, { status: 400 });
  }

  const adminDb = getAdminDb();
  const ref = adminDb.collection(collectionName).doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    return Response.json({ error: "File not found." }, { status: 404 });
  }

  const data = doc.data() || {};
  await destroyCloudinaryAsset(String(data.publicId || ""));
  await ref.delete();
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/subjects");
  revalidatePath("/notices");
  revalidatePath("/updates");

  return Response.json({ success: true });
}
