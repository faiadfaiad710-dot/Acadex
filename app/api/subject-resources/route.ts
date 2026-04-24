import { revalidatePath } from "next/cache";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { MAX_FILE_SIZE, SESSION_COOKIE_NAME } from "@/lib/constants";

export const runtime = "nodejs";

type SubjectResourceDoc = {
  id: string;
  name: string;
  parentResourceId?: string;
  sectionId?: string;
  type?: string;
};

type UploadedSubjectFile = {
  secureUrl: string;
  publicId: string;
  resourceType?: string;
  format?: string;
  fileType?: string;
  originalName?: string;
  relativePath?: string;
  fileSize?: number;
  displayName?: string;
};

async function ensureSubjectResourceFolderChain({
  adminDb,
  subjectId,
  sectionId,
  baseParentId,
  segments,
  resources
}: {
  adminDb: ReturnType<typeof getAdminDb>;
  subjectId: string;
  sectionId: string;
  baseParentId?: string;
  segments: string[];
  resources: Array<SubjectResourceDoc & Record<string, unknown>>;
}) {
  if (!segments.length) {
    return baseParentId ?? "";
  }

  let currentParentId = baseParentId ?? "";

  for (const rawSegment of segments) {
    const segment = rawSegment.trim();
    if (!segment) continue;

    const existing = resources.find((resource) => {
      return (
        String(resource.sectionId || "") === sectionId &&
        String(resource.parentResourceId || "") === currentParentId &&
        String(resource.type || "") === "folder" &&
        String(resource.name || "").trim().toLowerCase() === segment.toLowerCase()
      );
    });

    if (existing) {
      currentParentId = existing.id;
      continue;
    }

    const ref = await adminDb.collection("subjectResources").add({
      subjectId,
      sectionId,
      parentResourceId: currentParentId,
      name: segment,
      type: "folder",
      createdAt: new Date().toISOString()
    });

    resources.push({
      id: ref.id,
      subjectId,
      sectionId,
      parentResourceId: currentParentId,
      name: segment,
      type: "folder"
    });
    currentParentId = ref.id;
  }

  return currentParentId;
}

export async function POST(req: Request) {
  try {
    const session = req.headers
      .get("cookie")
      ?.split(";")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`))
      ?.slice(SESSION_COOKIE_NAME.length + 1);

    if (!session) {
      return Response.json({ error: "You must be signed in." }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const profileSnapshot = await adminDb.collection("users").doc(decoded.uid).get();
    const profile = profileSnapshot.data();

    if (!profileSnapshot.exists || profile?.role !== "admin") {
      return Response.json({ error: "Only admins can upload subject files." }, { status: 403 });
    }

    const body = (await req.json().catch(() => null)) as
      | {
          subjectId?: string;
          sectionId?: string;
          parentResourceId?: string;
          name?: string;
          files?: UploadedSubjectFile[];
        }
      | null;

    const subjectId = String(body?.subjectId || "").trim();
    const sectionId = String(body?.sectionId || "").trim();
    const parentResourceId = String(body?.parentResourceId || "").trim();
    const name = String(body?.name || "").trim();
    const files = Array.isArray(body?.files) ? body.files : [];

    if (!subjectId || !sectionId || !files.length) {
      return Response.json({ error: "Missing upload details." }, { status: 400 });
    }

    const existingSnapshot = await adminDb.collection("subjectResources").where("subjectId", "==", subjectId).get();
    const existingResources = existingSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>)
    })) as Array<SubjectResourceDoc & Record<string, unknown>>;

    const uploadedResources: Array<{ id: string; name: string }> = [];

    for (const file of files) {
      const bytes = Number(file.fileSize || 0);
      if (bytes > MAX_FILE_SIZE) {
        return Response.json({ error: `${file.originalName || file.displayName || "A file"} is too large. Maximum size is 25MB.` }, { status: 400 });
      }

      const relativeSegments = String(file.relativePath || "")
        .split("/")
        .map((segment) => segment.trim())
        .filter(Boolean);
      const nestedFolderSegments = relativeSegments.slice(0, -1);
      const finalParentId = await ensureSubjectResourceFolderChain({
        adminDb,
        subjectId,
        sectionId,
        baseParentId: parentResourceId,
        segments: nestedFolderSegments,
        resources: existingResources
      });

      const finalName = file.displayName || file.originalName || name || "Uploaded file";
      const saved = await adminDb.collection("subjectResources").add({
        subjectId,
        sectionId,
        parentResourceId: finalParentId,
        name: finalName,
        type: "file",
        fileUrl: file.secureUrl,
        publicId: file.publicId,
        fileType: file.fileType || "unknown",
        originalName: file.originalName || finalName,
        format: file.format || "",
        resourceType: file.resourceType || "raw",
        createdAt: new Date().toISOString()
      });

      uploadedResources.push({ id: saved.id, name: finalName });
    }

    revalidatePath("/subjects");
    revalidatePath(`/subjects/${subjectId}`);

    return Response.json({ count: uploadedResources.length, files: uploadedResources });
  } catch (error) {
    console.error("Subject resource metadata save failed", error);
    return Response.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 });
  }
}
