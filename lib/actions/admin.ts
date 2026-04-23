"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { MAX_FILE_SIZE, DEFAULT_SUBJECTS } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth/guards";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { normalizePhone, phoneToLoginEmail } from "@/lib/auth/phone";

const subjectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  code: z.string().min(2)
});

const teacherSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  designation: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  subjectIds: z.array(z.string()).default([])
});

const labSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  description: z.string().optional(),
  subjectId: z.string().min(1),
  subjectName: z.string().optional()
});

const createUserSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(5),
  password: z.string().min(6),
  role: z.enum(["admin", "user"])
});

const examSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  subjectId: z.string().min(1),
  examDate: z.string().min(1),
  startTime: z.string().optional(),
  room: z.string().optional(),
  note: z.string().optional()
});

function validateFile(file: File | null | undefined) {
  if (!file || file.size === 0) return;
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File is too large. Maximum size is 25MB.");
  }
}

export async function createUserAction(formData: FormData) {
  await requireAdmin();
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();
  const parsed = createUserSchema.parse({
    email: formData.get("email") || "",
    phone: formData.get("phone"),
    password: formData.get("password"),
    role: formData.get("role")
  });
  const phone = normalizePhone(parsed.phone);
  const loginEmail = parsed.email || phoneToLoginEmail(phone);
  if (!loginEmail || !phone) {
    throw new Error("A valid phone number is required.");
  }

  const userRecord = await adminAuth.createUser({
    email: loginEmail,
    password: parsed.password
  });

  await adminAuth.setCustomUserClaims(userRecord.uid, { role: parsed.role });

  await adminDb.collection("users").doc(userRecord.uid).set({
    uid: userRecord.uid,
    email: loginEmail,
    phone,
    loginId: phone,
    role: parsed.role,
    mustChangePassword: true,
    createdAt: new Date().toISOString()
  });

  revalidatePath("/admin");
}

export async function saveSubjectAction(formData: FormData) {
  await requireAdmin();
  const adminDb = getAdminDb();
  const parsed = subjectSchema.parse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    code: formData.get("code")
  });

  if (parsed.id) {
    await adminDb.collection("subjects").doc(parsed.id).set(
      {
        name: parsed.name,
        code: parsed.code
      },
      { merge: true }
    );
  } else {
    await adminDb.collection("subjects").add({
      name: parsed.name,
      code: parsed.code,
      createdAt: new Date().toISOString()
    });
  }

  revalidatePath("/subjects");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}

export async function deleteSubjectAction(formData: FormData) {
  await requireAdmin();
  const adminDb = getAdminDb();
  const id = String(formData.get("id"));
  await adminDb.collection("subjects").doc(id).delete();
  revalidatePath("/subjects");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}

export async function seedDefaultSubjectsAction() {
  await requireAdmin();
  const adminDb = getAdminDb();
  const existing = await adminDb.collection("subjects").get();
  const existingCodes = new Set(existing.docs.map((doc) => String(doc.data().code)));
  const batch = adminDb.batch();

  DEFAULT_SUBJECTS.forEach((subject) => {
    if (existingCodes.has(subject.code)) return;
    const ref = adminDb.collection("subjects").doc();
    batch.set(ref, {
      ...subject,
      createdAt: new Date().toISOString()
    });
  });

  await batch.commit();
  revalidatePath("/subjects");
  revalidatePath("/dashboard");
}

export async function uploadAcademicFileAction(formData: FormData) {
  const admin = await requireAdmin();
  const adminDb = getAdminDb();
  const title = String(formData.get("title") || "");
  const subjectId = String(formData.get("subjectId") || "");
  const file = formData.get("file") as File;

  if (!title || !subjectId || !file) {
    throw new Error("Missing required fields");
  }

  const subjectDoc = await adminDb.collection("subjects").doc(subjectId).get();
  const subjectName = String(subjectDoc.data()?.name || "");
  if (!subjectName) throw new Error("Invalid subject");

  validateFile(file);
  const uploaded = await uploadToCloudinary(file, "academic-files/files");

  await adminDb.collection("files").add({
    title,
    subjectId,
    subjectName,
    fileUrl: uploaded.secure_url,
    uploadDate: new Date().toISOString(),
    uploadedBy: admin.email,
    fileType: file.type || "unknown",
    fileSize: file.size
  });

  revalidatePath("/upload");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}

export async function saveNoticeAction(formData: FormData) {
  await requireAdmin();
  const adminDb = getAdminDb();
  const text = String(formData.get("text") || "");
  const file = formData.get("file") as File | null;

  if (!text) throw new Error("Notice text is required");
  validateFile(file);

  let fileUrl = "";
  let attachmentName = "";
  if (file && file.size > 0) {
    const uploaded = await uploadToCloudinary(file, "academic-files/notices");
    fileUrl = uploaded.secure_url;
    attachmentName = uploaded.original_filename;
  }

  await adminDb.collection("notices").add({
    text,
    fileUrl,
    attachmentName,
    date: new Date().toISOString()
  });

  revalidatePath("/notices");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}

export async function deleteNoticeAction(formData: FormData) {
  await requireAdmin();
  const adminDb = getAdminDb();
  const id = String(formData.get("id"));
  await adminDb.collection("notices").doc(id).delete();
  revalidatePath("/notices");
  revalidatePath("/dashboard");
}

export async function saveTeacherAction(formData: FormData) {
  await requireAdmin();
  const adminDb = getAdminDb();
  const subjectIds = formData.getAll("subjectIds").map(String);
  const parsed = teacherSchema.parse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    designation: formData.get("designation") || "",
    email: formData.get("email") || "",
    phone: formData.get("phone") || "",
    subjectIds
  });

  if (parsed.id) {
    await adminDb.collection("teachers").doc(parsed.id).set(
      {
        ...parsed
      },
      { merge: true }
    );
  } else {
    await adminDb.collection("teachers").add({
      ...parsed,
      createdAt: new Date().toISOString()
    });
  }

  revalidatePath("/teachers");
  revalidatePath("/subjects");
}

export async function deleteTeacherAction(formData: FormData) {
  await requireAdmin();
  const adminDb = getAdminDb();
  const id = String(formData.get("id"));
  await adminDb.collection("teachers").doc(id).delete();
  revalidatePath("/teachers");
}

export async function saveLabAction(formData: FormData) {
  await requireAdmin();
  const adminDb = getAdminDb();
  const parsed = labSchema.parse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    description: formData.get("description") || "",
    subjectId: formData.get("subjectId"),
    subjectName: formData.get("subjectName")
  });
  const file = formData.get("file") as File | null;
  validateFile(file);
  const subjectDoc = await adminDb.collection("subjects").doc(parsed.subjectId).get();
  const subjectName = String(subjectDoc.data()?.name || parsed.subjectName);

  let fileUrl = "";
  if (file && file.size > 0) {
    const uploaded = await uploadToCloudinary(file, "academic-files/labs");
    fileUrl = uploaded.secure_url;
  }

  if (parsed.id) {
    await adminDb.collection("labs").doc(parsed.id).set(
      {
        title: parsed.title,
        description: parsed.description,
        subjectId: parsed.subjectId,
        subjectName,
        ...(fileUrl ? { fileUrl } : {})
      },
      { merge: true }
    );
  } else {
    await adminDb.collection("labs").add({
      ...parsed,
      subjectName,
      fileUrl,
      date: new Date().toISOString()
    });
  }

  revalidatePath("/labs");
  revalidatePath("/dashboard");
}

export async function deleteLabAction(formData: FormData) {
  await requireAdmin();
  const adminDb = getAdminDb();
  const id = String(formData.get("id"));
  await adminDb.collection("labs").doc(id).delete();
  revalidatePath("/labs");
  revalidatePath("/dashboard");
}

export async function updateMustChangeFlagAction(uid: string, mustChangePassword: boolean) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Unauthorized");

  const adminDb = getAdminDb();
  await adminDb.collection("users").doc(uid).set(
    {
      mustChangePassword
    },
    { merge: true }
  );
  revalidatePath("/admin");
}

export async function touchUserAction(uid: string) {
  await requireAdmin();
  const adminDb = getAdminDb();
  await adminDb.collection("users").doc(uid).set(
    {
      lastSeenAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export async function saveExamAction(formData: FormData) {
  await requireAdmin();
  const adminDb = getAdminDb();
  const parsed = examSchema.parse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    subjectId: formData.get("subjectId"),
    examDate: formData.get("examDate"),
    startTime: formData.get("startTime") || "",
    room: formData.get("room") || "",
    note: formData.get("note") || ""
  });

  const subjectDoc = await adminDb.collection("subjects").doc(parsed.subjectId).get();
  const subjectName = String(subjectDoc.data()?.name || "");
  if (!subjectName) throw new Error("Invalid subject");

  const payload = {
    title: parsed.title,
    subjectId: parsed.subjectId,
    subjectName,
    examDate: parsed.examDate,
    startTime: parsed.startTime ?? "",
    room: parsed.room ?? "",
    note: parsed.note ?? ""
  };

  if (parsed.id) {
    await adminDb.collection("exams").doc(parsed.id).set(payload, { merge: true });
  } else {
    await adminDb.collection("exams").add({
      ...payload,
      createdAt: new Date().toISOString()
    });
  }

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function deleteExamAction(formData: FormData) {
  await requireAdmin();
  const adminDb = getAdminDb();
  const id = String(formData.get("id"));
  await adminDb.collection("exams").doc(id).delete();
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}
