export type UserRole = "admin" | "manager" | "user";
export type Language = "en" | "bn";
export type ThemeName =
  | "aurora"
  | "scholar"
  | "sunrise"
  | "emerald"
  | "midnight"
  | "palette01"
  | "palette02"
  | "palette03"
  | "palette04"
  | "palette05"
  | "palette06";
export type SurfaceMode = "light" | "dark" | "black";

export interface UserProfile {
  uid: string;
  email: string;
  phone?: string;
  loginId?: string;
  role: UserRole;
  mustChangePassword?: boolean;
  createdAt?: string;
  lastSeenAt?: string;
  openAiApiKey?: string;
  openAiKeyUpdatedAt?: string;
}

export interface Semester {
  id: string;
  name: string;
  createdAt?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  semesterId?: string;
  semesterName?: string;
  createdAt?: string;
}

export interface SubjectSection {
  id: string;
  subjectId: string;
  subjectName?: string;
  name: string;
  kind: "major" | "minor" | "custom";
  teacherId?: string;
  teacherName?: string;
  createdAt?: string;
}

export interface SubjectResource {
  id: string;
  subjectId: string;
  sectionId: string;
  parentResourceId?: string;
  name: string;
  type: "section" | "folder" | "file";
  fileUrl?: string;
  fileType?: string;
  originalName?: string;
  format?: string;
  resourceType?: string;
  publicId?: string;
  createdAt?: string;
}

export interface FileRecord {
  id: string;
  title: string;
  fileUrl: string;
  originalName?: string;
  publicId?: string;
  resourceType?: string;
  format?: string;
  subjectId: string;
  subjectName: string;
  uploadDate: string;
  uploadedBy?: string;
  fileType?: string;
  fileSize?: number;
}

export interface Notice {
  id: string;
  text: string;
  fileUrl?: string;
  attachmentName?: string;
  fileType?: string;
  format?: string;
  resourceType?: string;
  publicId?: string;
  date: string;
}

export interface Teacher {
  id: string;
  name: string;
  designation?: string;
  email?: string;
  phone?: string;
  subjectIds: string[];
  createdAt?: string;
}

export interface LabRecord {
  id: string;
  title: string;
  description?: string;
  subjectId: string;
  subjectName: string;
  fileUrl?: string;
  date: string;
}

export interface ExamEvent {
  id: string;
  kind?: "exam" | "event";
  title: string;
  subjectId?: string;
  subjectName?: string;
  examDate: string;
  startTime?: string;
  room?: string;
  note?: string;
  createdAt?: string;
}

export interface ClassRoutine {
  id: string;
  subjectId: string;
  subjectName: string;
  day: "saturday" | "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
  startTime: string;
  endTime?: string;
  room?: string;
  teacherId?: string;
  teacherName?: string;
  note?: string;
  createdAt?: string;
}

export interface DashboardStats {
  totalFiles: number;
  totalSubjects: number;
  totalUsers: number;
  filesPerSubject: { subject: string; total: number }[];
  recentUploads: FileRecord[];
}

export interface ActivityLog {
  id: string;
  uid: string;
  userLabel: string;
  subjectId: string;
  subjectName: string;
  action: "subject_enter" | "file_open" | "file_download";
  itemId?: string;
  itemType?: "file" | "resource";
  createdAt: string;
}

export interface StudentReadingInsight {
  favoriteSubjectName: string;
  favoriteSubjectCount: number;
  monthlyReads: { subject: string; total: number }[];
}

export interface AdminReadingInsight {
  popularSubjects: { subject: string; total: number }[];
  userReads: Array<{
    uid: string;
    userLabel: string;
    topSubjectName: string;
    totalReads: number;
    lastSubjectName: string;
    lastEnteredAt: string;
  }>;
}

export type AiSourceType = "file" | "resource" | "notice" | "lab" | "teacher" | "subject";
export type AiUsageAction = "chat" | "analysis" | "search";

export interface AiSearchResult {
  id: string;
  sourceType: AiSourceType;
  title: string;
  subject?: string;
  teacher?: string;
  fileType?: string;
  openHref?: string;
  downloadHref?: string;
  relevance: number;
}

export interface AiUsageLog {
  id: string;
  uid: string;
  userLabel: string;
  action: AiUsageAction;
  prompt?: string;
  sourceId?: string;
  sourceType?: AiSourceType;
  resultCount?: number;
  model?: string;
  createdAt: string;
}
