import { DashboardStats, ExamEvent, FileRecord, LabRecord, Notice, Semester, Subject, Teacher, UserProfile } from "@/lib/types";
import { getAdminDb } from "@/lib/firebase/admin";

function serializeFirestoreValue(value: unknown): unknown {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (
    value &&
    typeof value === "object" &&
    "_seconds" in value &&
    typeof (value as { _seconds?: unknown })._seconds === "number"
  ) {
    return new Date((value as { _seconds: number })._seconds * 1000).toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeFirestoreValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, serializeFirestoreValue(item)])
    );
  }

  return value;
}

function normalize<T extends { id?: string }>(id: string, data: Record<string, unknown>) {
  return { id, ...(serializeFirestoreValue(data) as Record<string, unknown>) } as T;
}

export async function getAllSubjects() {
  const adminDb = getAdminDb();
  try {
    const snapshot = await adminDb.collection("subjects").get();
    return snapshot.docs
      .map((doc) => normalize<Subject>(doc.id, doc.data()))
      .sort((a, b) => {
        const semesterA = (a.semesterName || "").toLowerCase();
        const semesterB = (b.semesterName || "").toLowerCase();
        if (semesterA !== semesterB) return semesterA.localeCompare(semesterB);
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
  } catch (error) {
    console.error("Failed to load subjects", error);
    return [];
  }
}

export async function getAllSemesters() {
  const adminDb = getAdminDb();
  try {
    const snapshot = await adminDb.collection("semesters").orderBy("name").get();
    return snapshot.docs.map((doc) => normalize<Semester>(doc.id, doc.data()));
  } catch (error) {
    console.error("Failed to load semesters", error);
    return [];
  }
}

export async function getAllFiles() {
  const adminDb = getAdminDb();
  try {
    const snapshot = await adminDb.collection("files").orderBy("uploadDate", "desc").get();
    return snapshot.docs.map((doc) => normalize<FileRecord>(doc.id, doc.data()));
  } catch (error) {
    console.error("Failed to load files", error);
    return [];
  }
}

export async function getAllNotices() {
  const adminDb = getAdminDb();
  try {
    const snapshot = await adminDb.collection("notices").orderBy("date", "desc").get();
    return snapshot.docs.map((doc) => normalize<Notice>(doc.id, doc.data()));
  } catch (error) {
    console.error("Failed to load notices", error);
    return [];
  }
}

export async function getAllTeachers() {
  const adminDb = getAdminDb();
  try {
    const snapshot = await adminDb.collection("teachers").orderBy("name").get();
    return snapshot.docs.map((doc) => normalize<Teacher>(doc.id, doc.data()));
  } catch (error) {
    console.error("Failed to load teachers", error);
    return [];
  }
}

export async function getAllLabs() {
  const adminDb = getAdminDb();
  try {
    const snapshot = await adminDb.collection("labs").orderBy("date", "desc").get();
    return snapshot.docs.map((doc) => normalize<LabRecord>(doc.id, doc.data()));
  } catch (error) {
    console.error("Failed to load labs", error);
    return [];
  }
}

export async function getAllExams() {
  const adminDb = getAdminDb();
  try {
    const snapshot = await adminDb.collection("exams").orderBy("examDate", "asc").get();
    return snapshot.docs.map((doc) => normalize<ExamEvent>(doc.id, doc.data()));
  } catch (error) {
    console.error("Failed to load exams", error);
    return [];
  }
}

export async function getAllUsers() {
  const adminDb = getAdminDb();
  try {
    const snapshot = await adminDb.collection("users").orderBy("email").get();
    return snapshot.docs.map((doc) => doc.data() as UserProfile);
  } catch (error) {
    console.error("Failed to load users", error);
    return [];
  }
}

export async function getAdminStats(): Promise<DashboardStats> {
  const [files, subjects, users] = await Promise.all([getAllFiles(), getAllSubjects(), getAllUsers()]);
  const filesPerSubject = subjects.map((subject) => ({
    subject: subject.code,
    total: files.filter((file) => file.subjectId === subject.id).length
  }));

  return {
    totalFiles: files.length,
    totalSubjects: subjects.length,
    totalUsers: users.length,
    filesPerSubject,
    recentUploads: files.slice(0, 6)
  };
}
