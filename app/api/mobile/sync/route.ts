import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

function serializeDoc(doc: FirebaseFirestore.QueryDocumentSnapshot) {
  const data = doc.data();
  return {
    id: doc.id,
    ...Object.fromEntries(
      Object.entries(data).map(([key, value]) => {
        if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
          return [key, value.toDate().toISOString()];
        }
        return [key, value];
      })
    )
  };
}

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
    profile: {
      id: profileDoc.id,
      ...profileDoc.data()
    }
  };
}

export async function GET(req: Request) {
  const user = await getMobileUser(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminDb = getAdminDb();
  const [subjects, sections, resources, files, notices, routines, teachers] = await Promise.all([
    adminDb.collection("subjects").get(),
    adminDb.collection("subjectSections").get(),
    adminDb.collection("subjectResources").get(),
    adminDb.collection("files").get(),
    adminDb.collection("notices").get(),
    adminDb.collection("classRoutines").get(),
    adminDb.collection("teachers").get()
  ]);

  return Response.json({
    profile: user.profile,
    subjects: subjects.docs.map(serializeDoc),
    sections: sections.docs.map(serializeDoc),
    resources: resources.docs.map(serializeDoc),
    files: files.docs.map(serializeDoc),
    notices: notices.docs.map(serializeDoc),
    routines: routines.docs.map(serializeDoc),
    teachers: teachers.docs.map(serializeDoc),
    syncedAt: new Date().toISOString()
  });
}
