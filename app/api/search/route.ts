import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";

type SearchItem = {
  id: string;
  type: "file" | "teacher" | "notice" | "lab" | "subject";
  title: string;
  subtitle?: string;
  href: string;
};

function includesText(value: unknown, query: string) {
  return typeof value === "string" && value.toLowerCase().includes(query);
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  if (!query) {
    return Response.json({ results: [] });
  }

  const db = getAdminDb();

  const [filesSnap, teachersSnap, noticesSnap, labsSnap, subjectsSnap] = await Promise.all([
    db.collection("files").limit(150).get(),
    db.collection("teachers").limit(100).get(),
    db.collection("notices").limit(100).get(),
    db.collection("labs").limit(100).get(),
    db.collection("subjects").limit(100).get()
  ]);

  const results: SearchItem[] = [];

  filesSnap.docs.forEach((doc) => {
    const data = doc.data();
    if (includesText(data.title, query) || includesText(data.subjectName, query)) {
      results.push({
        id: doc.id,
        type: "file",
        title: String(data.title || "File"),
        subtitle: String(data.subjectName || ""),
        href: `/api/files/open?id=${encodeURIComponent(doc.id)}`
      });
    }
  });

  teachersSnap.docs.forEach((doc) => {
    const data = doc.data();
    if (includesText(data.name, query) || includesText(data.designation, query) || includesText(data.email, query)) {
      results.push({
        id: doc.id,
        type: "teacher",
        title: String(data.name || "Teacher"),
        subtitle: String(data.designation || ""),
        href: "/teachers"
      });
    }
  });

  noticesSnap.docs.forEach((doc) => {
    const data = doc.data();
    if (includesText(data.text, query)) {
      results.push({
        id: doc.id,
        type: "notice",
        title: String(data.text || "Notice").slice(0, 80),
        subtitle: "Notice",
        href: "/notices"
      });
    }
  });

  labsSnap.docs.forEach((doc) => {
    const data = doc.data();
    if (includesText(data.title, query) || includesText(data.subjectName, query) || includesText(data.description, query)) {
      results.push({
        id: doc.id,
        type: "lab",
        title: String(data.title || "Lab"),
        subtitle: String(data.subjectName || ""),
        href: "/labs"
      });
    }
  });

  subjectsSnap.docs.forEach((doc) => {
    const data = doc.data();
    if (includesText(data.name, query) || includesText(data.code, query) || includesText(data.semesterName, query)) {
      results.push({
        id: doc.id,
        type: "subject",
        title: String(data.name || "Subject"),
        subtitle: String(data.code || data.semesterName || ""),
        href: "/subjects"
      });
    }
  });

  return Response.json({ results: results.slice(0, 18) });
}
