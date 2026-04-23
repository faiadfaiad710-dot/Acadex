export type UserRole = "admin" | "user";
export type Language = "en" | "bn";
export type ThemeName = "aurora" | "scholar" | "sunrise" | "emerald" | "midnight" | "liquid";

export interface UserProfile {
  uid: string;
  email: string;
  phone?: string;
  loginId?: string;
  codeNumber?: string;
  role: UserRole;
  mustChangePassword?: boolean;
  createdAt?: string;
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

export interface FileRecord {
  id: string;
  title: string;
  fileUrl: string;
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
  title: string;
  subjectId: string;
  subjectName: string;
  examDate: string;
  startTime?: string;
  room?: string;
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
