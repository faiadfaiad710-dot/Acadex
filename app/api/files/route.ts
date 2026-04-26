import { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { deleteFromGoogleDrive } from "@/lib/google-drive";
import { FileRecord } from "@/lib/types";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

function getSessionCookie(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
}

async function requireAdmin(request: NextRequest) {
  const session = getSessionCookie(request);
  if (!session) return null;

  const decoded = await getAdminAuth().verifySessionCookie(session, true).catch(() => null);
  if (!decoded) return null;

  const profileSnapshot = await getAdminDb().collection("users").doc(decoded.uid).get();
  const profile = profileSnapshot.data();

  if (!profileSnapshot.exists || profile?.role !== "admin") {
    return null;
  }

  return decoded;
}

async function destroyCloudinaryAsset(file: FileRecord) {
  if (file.resourceType === "drive" && file.publicId) {
    await deleteFromGoogleDrive(file.publicId);
    return;
  }

  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  if (!file.publicId) return;

  const candidates = Array.from(
    new Set(
      [file.resourceType, "raw", "image", "video"]
        .filter((value): value is string => Boolean(value))
        .map((resourceType) => ({ resource_type: resourceType, invalidate: true, type: "upload" as const }))
    )
  );

  for (const options of candidates) {
    const result = await cloudinary.uploader.destroy(file.publicId, options).catch(() => null);
    if (result?.result === "ok" || result?.result === "not found") {
      return;
    }
  }
}

export async function DELETE(request: NextRequest) {
  const adminUser = await requireAdmin(request);
  if (!adminUser) {
    return Response.json({ error: "Only admins can delete files." }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return Response.json({ error: "File id is required." }, { status: 400 });
  }

  const adminDb = getAdminDb();
  const fileRef = adminDb.collection("files").doc(id);
  const fileSnapshot = await fileRef.get();

  if (!fileSnapshot.exists) {
    return Response.json({ error: "File not found." }, { status: 404 });
  }

  const file = { id: fileSnapshot.id, ...fileSnapshot.data() } as FileRecord;

  try {
    await destroyCloudinaryAsset(file);
    await fileRef.delete();

    return Response.json({ success: true, deletedBy: adminUser.uid });
  } catch (error) {
    console.error("Failed to delete file", error);
    return Response.json({ error: "File delete failed." }, { status: 500 });
  }
}
