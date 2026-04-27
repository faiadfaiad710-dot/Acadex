import {
  ActivityLog,
  AdminReadingInsight,
  DashboardStats,
  ExamEvent,
  FileRecord,
  LabRecord,
  Notice,
  StudentReadingInsight,
  Semester,
  Subject,
  SubjectResource,
  SubjectSection,
  Teacher,
  UserProfile
} from "@/lib/types";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

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

export async function getAllSubjectSections() {
  const adminDb = getAdminDb();
  try {
    const snapshot = await adminDb.collection("subjectSections").get();
    return snapshot.docs
      .map((doc) => normalize<SubjectSection>(doc.id, doc.data()))
      .sort((a, b) => {
        if (a.subjectId !== b.subjectId) return a.subjectId.localeCompare(b.subjectId);
        const order = { major: 0, minor: 1, custom: 2 } as const;
        if (order[a.kind] !== order[b.kind]) return order[a.kind] - order[b.kind];
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
  } catch (error) {
    console.error("Failed to load subject sections", error);
    return [];
  }
}

export async function getAllSubjectResources() {
  const adminDb = getAdminDb();
  try {
    const snapshot = await adminDb.collection("subjectResources").get();
    return snapshot.docs
      .map((doc) => normalize<SubjectResource>(doc.id, doc.data()))
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  } catch (error) {
    console.error("Failed to load subject resources", error);
    return [];
  }
}

export async function getAllActivityLogs() {
  const adminDb = getAdminDb();
  try {
    const snapshot = await adminDb.collection("activityLogs").orderBy("createdAt", "desc").get();
    return snapshot.docs.map((doc) => normalize<ActivityLog>(doc.id, doc.data()));
  } catch (error) {
    console.error("Failed to load activity logs", error);
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

function toMs(value?: string) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function identifierFromEmail(email?: string) {
  const value = String(email || "").trim().toLowerCase();
  if (value.endsWith("@phone.academic.local")) {
    const identifier = value.replace("@phone.academic.local", "");
    return identifier.startsWith("plus") ? `+${identifier.slice(4)}` : identifier;
  }
  return "";
}

function isCurrentMonth(value?: string) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function rankSubjects(logs: ActivityLog[]) {
  const counts = new Map<string, number>();
  logs.forEach((log) => {
    const key = log.subjectName || "Unknown subject";
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([subject, total]) => ({ subject, total }))
    .sort((a, b) => b.total - a.total || a.subject.localeCompare(b.subject));
}

export async function getStudentReadingInsight(uid: string): Promise<StudentReadingInsight> {
  const logs = (await getAllActivityLogs()).filter((log) => log.uid === uid && isCurrentMonth(log.createdAt));
  const monthlyReads = rankSubjects(logs);
  const favorite = monthlyReads[0];

  return {
    favoriteSubjectName: favorite?.subject || "No subject yet",
    favoriteSubjectCount: favorite?.total || 0,
    monthlyReads: monthlyReads.slice(0, 6)
  };
}

export async function getAdminReadingInsight(): Promise<AdminReadingInsight> {
  const [logs, profiles] = await Promise.all([getAllActivityLogs(), getAllUsers()]);
  const profileByUid = new Map(profiles.map((profile) => [profile.uid, profile]));
  const popularSubjects = rankSubjects(
    logs.filter((log) => isCurrentMonth(log.createdAt) && (log.action === "file_open" || log.action === "file_download"))
  ).slice(0, 6);

  const users = new Map<string, ActivityLog[]>();
  logs.forEach((log) => {
    const current = users.get(log.uid);
    if (current) {
      current.push(log);
    } else {
      users.set(log.uid, [log]);
    }
  });

  const userReads = await Promise.all(
    Array.from(users.entries()).map(async ([uid, items]) => {
      const sorted = [...items].sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
      const topSubject = rankSubjects(items.filter((item) => isCurrentMonth(item.createdAt)))[0];
      const lastSubject = sorted.find((item) => Boolean(item.subjectName));
      const profile = profileByUid.get(uid);
      let resolvedLabel =
        profile?.loginId ||
        profile?.phone ||
        identifierFromEmail(profile?.email) ||
        sorted[0]?.userLabel ||
        uid;

      if (resolvedLabel === uid) {
        const authUser = await getAdminAuth().getUser(uid).catch(() => null);
        const authIdentifier =
          identifierFromEmail(authUser?.email) ||
          authUser?.phoneNumber ||
          "";
        if (authIdentifier) {
          resolvedLabel = authIdentifier;
        }
      }

      return {
        uid,
        userLabel: resolvedLabel,
        topSubjectName: topSubject?.subject || "No subject yet",
        totalReads: items.filter((item) => item.action === "subject_enter" || item.action === "file_open" || item.action === "file_download").length,
        lastSubjectName: lastSubject?.subjectName || "No subject yet",
        lastEnteredAt: lastSubject?.createdAt || ""
      };
    })
  );

  return {
    popularSubjects,
    userReads: userReads.sort((a, b) => b.totalReads - a.totalReads || toMs(b.lastEnteredAt) - toMs(a.lastEnteredAt))
  };
}

export async function getUnreadNotificationCount(lastSeenAt?: string) {
  const cutoff = toMs(lastSeenAt);
  const [files, notices, labs, exams, resources] = await Promise.all([
    getAllFiles(),
    getAllNotices(),
    getAllLabs(),
    getAllExams(),
    getAllSubjectResources()
  ]);

  const timestamps = [
    ...files.map((item) => item.uploadDate),
    ...notices.map((item) => item.date),
    ...labs.map((item) => item.date),
    ...exams.map((item) => item.createdAt || item.examDate),
    ...resources.map((item) => item.createdAt)
  ];

  const count = cutoff ? timestamps.filter((value) => toMs(value) > cutoff).length : timestamps.length;

  return count;
}
