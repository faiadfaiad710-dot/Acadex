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
  code: z.string().min(2),
  semesterId: z.string().optional()
});

const subjectSectionSchema = z.object({
  id: z.string().optional(),
  subjectId: z.string().min(1),
  name: z.string().min(2),
  kind: z.enum(["major", "minor", "custom"]),
  teacherId: z.string().optional()
});

const subjectResourceSchema = z.object({
  id: z.string().optional(),
  subjectId: z.string().min(1),
  sectionId: z.string().min(1),
  name: z.string().min(2),
  type: z.enum(["folder", "file"])
});

const semesterSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2)
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
  const directEmail = String(parsed.email || "").trim().toLowerCase();
  const loginEmail = directEmail || phoneToLoginEmail(phone);
  if (!loginEmail || !phone) {
    throw new Error("A valid phone number is required.");
  }

  const existingUser = await adminAuth.getUserByEmail(loginEmail).catch(() => null);
  const userRecord = existingUser
    ? await adminAuth.updateUser(existingUser.uid, {
        email: loginEmail,
        password: parsed.password
      })
    : await adminAuth.createUser({
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

export async function deleteUserAction(formData: FormData) {
  const currentAdmin = await requireAdmin();
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();
  const uid = String(formData.get("uid") || "");

  if (!uid) {
    throw new Error("User id is required.");
  }

  if (uid === currentAdmin.uid) {
    throw new Error("You cannot delete your own admin account.");
  }

  await adminAuth.deleteUser(uid).catch(async (error: { code?: string }) => {
    if (error?.code !== "auth/user-not-found") {
      throw error;
    }
  });
  await adminDb.collection("users").doc(uid).delete();

  revalidatePath("/admin");
}

export async function saveSubjectAction(formData: FormData) {
  await requireAdmin();
  const adminDb = getAdminDb();
  const parsed = subjectSchema.parse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    code: formData.get("code"),
    semesterId: formData.get("semesterId") || undefined
  });
  let semesterName = "";
  if (parsed.semesterId) {
    const semesterDoc = await adminDb.collection("semesters").doc(parsed.semesterId).get();
    semesterName = String(semesterDoc.data()?.name || "");
  }

  if (parsed.id) {
    await adminDb.collection("subjects").doc(parsed.id).set(
      {
        name: parsed.name,
        code: parsed.code,
        semesterId: parsed.semesterId ?? "",
        semesterName
      },
      { merge: true }
    );
    const sectionsSnapshot = await adminDb.collection("subjectSections").where("subjectId", "==", parsed.id).get();
    if (!sectionsSnapshot.empty) {
      const batch = adminDb.batch();
      sectionsSnapshot.docs.forEach((doc) => batch.set(doc.ref, { subjectName: parsed.name }, { merge: true }));
      await batch.commit();
    }
  } else {
    const subjectRef = adminDb.collection("subjects").doc();
    await subjectRef.set({
      name: parsed.name,
      code: parsed.code,
      semesterId: parsed.semesterId ?? "",
      semesterName,
      createdAt: new Date().toISOString()
    });
    await Promise.all([
      adminDb.collection("subjectSections").add({
        subjectId: subjectRef.id,
        subjectName: parsed.name,
        name: "Major",
        kind: "major",
        teacherId: "",
        teacherName: "",
        createdAt: new Date().toISOString()
      }),
      adminDb.collection("subjectSections").add({
        subjectId: subjectRef.id,
        subjectName: parsed.name,
        name: "Minor",
        kind: "minor",
        teacherId: "",
        teacherName: "",
        createdAt: new Date().toISOString()
      })
    ]);
  }

  revalidatePath("/subjects");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}

export async function saveSemesterAction(formData: FormData) {
  await requireAdmin();
  const adminDb = getAdminDb();
  const parsed = semesterSchema.parse({
    id: formData.get("id") || undefined,
    name: formData.get("name")
  });

  if (parsed.id) {
    await adminDb.collection("semesters").doc(parsed.id).set({ name: parsed.name }, { merge: true });
  } else {
    await adminDb.collection("semesters").add({
      name: parsed.name,
      createdAt: new Date().toISOString()
    });
  }

  revalidatePath("/subjects");
}

export async function deleteSemesterAction(formData: FormData) {
  await requireAdmin();
  const adminDb = getAdminDb();
  const id = String(formData.get("id"));
  await adminDb.collection("semesters").doc(id).delete();
  revalidatePath("/subjects");
}

export async function deleteSubjectAction(formData: FormData) {
  await requireAdmin();
  const adminDb = getAdminDb();
  const id = String(formData.get("id"));
  const [sectionsSnapshot, resourcesSnapshot] = await Promise.all([
    adminDb.collection("subjectSections").where("subjectId", "==", id).get(),
    adminDb.collection("subjectResources").where("subjectId", "==", id).get()
  ]);
  const batch = adminDb.batch();
  batch.delete(adminDb.collection("subjects").doc(id));
  sectionsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
  resourcesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
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
  const subjectIds = Array.from(new Set(formData.getAll("subjectIds").map(String).filter(Boolean)));
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
        name: parsed.name,
        designation: parsed.designation || "",
        email: parsed.email || "",
        phone: parsed.phone || "",
        subjectIds: parsed.subjectIds
      },
      { merge: true }
    );
  } else {
    await adminDb.collection("teachers").add({
      name: parsed.name,
      designation: parsed.designation || "",
      email: parsed.email || "",
      phone: parsed.phone || "",
      subjectIds: parsed.subjectIds,
      createdAt: new Date().toISOString()
    });
  }

  revalidatePath("/teachers");
  revalidatePath("/subjects");
  revalidatePath("/dashboard");
}

export async function saveSubjectSectionAction(formData: FormData) {
  await requireAdmin();
  const adminDb = getAdminDb();
  const parsed = subjectSectionSchema.parse({
    id: formData.get("id") || undefined,
    subjectId: formData.get("subjectId"),
    name: formData.get("name"),
    kind: formData.get("kind"),
    teacherId: formData.get("teacherId") || undefined
  });

  const [subjectDoc, teacherDoc] = await Promise.all([
    adminDb.collection("subjects").doc(parsed.subjectId).get(),
    parsed.teacherId ? adminDb.collection("teachers").doc(parsed.teacherId).get() : Promise.resolve(null)
  ]);
  const subjectName = String(subjectDoc.data()?.name || "");
  const teacherName = String(teacherDoc?.data()?.name || "");

  const payload = {
    subjectId: parsed.subjectId,
    subjectName,
    name: parsed.name,
    kind: parsed.kind,
    teacherId: parsed.teacherId ?? "",
    teacherName
  };

  if (parsed.id) {
    await adminDb.collection("subjectSections").doc(parsed.id).set(payload, { merge: true });
  } else {
    await adminDb.collection("subjectSections").add({
      ...payload,
      createdAt: new Date().toISOString()
    });
  }

  revalidatePath("/subjects");
}

export async function deleteSubjectSectionAction(formData: FormData) {
  await requireAdmin();
  const adminDb = getAdminDb();
  const id = String(formData.get("id"));
  const resources = await adminDb.collection("subjectResources").where("sectionId", "==", id).get();
  const batch = adminDb.batch();
  resources.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(adminDb.collection("subjectSections").doc(id));
  await batch.commit();
  revalidatePath("/subjects");
}

export async function saveSubjectResourceAction(formData: FormData) {
  await requireAdmin();
  const adminDb = getAdminDb();
  const parsed = subjectResourceSchema.parse({
    id: formData.get("id") || undefined,
    subjectId: formData.get("subjectId"),
    sectionId: formData.get("sectionId"),
    name: formData.get("name"),
    type: formData.get("type")
  });
  const file = formData.get("file") as File | null;

  let fileUrl = "";
  let publicId = "";
  let fileType = "";

  if (parsed.type === "file") {
    validateFile(file);
    if (!file || file.size === 0) {
      throw new Error("Please choose a file to upload.");
    }

    const uploaded = await uploadToCloudinary(file, `academic-files/subjects/${parsed.subjectId}`);
    fileUrl = uploaded.secure_url;
    publicId = "public_id" in uploaded ? String((uploaded as { public_id?: string }).public_id || "") : "";
    fileType = file.type || "unknown";
  }

  const payload = {
    subjectId: parsed.subjectId,
    sectionId: parsed.sectionId,
    name: parsed.name,
    type: parsed.type,
    ...(fileUrl ? { fileUrl, publicId, fileType } : {})
  };

  if (parsed.id) {
    await adminDb.collection("subjectResources").doc(parsed.id).set(payload, { merge: true });
  } else {
    await adminDb.collection("subjectResources").add({
      ...payload,
      createdAt: new Date().toISOString()
    });
  }

  revalidatePath("/subjects");
}

export async function deleteSubjectResourceAction(formData: FormData) {
  await requireAdmin();
  const adminDb = getAdminDb();
  const id = String(formData.get("id"));
  await adminDb.collection("subjectResources").doc(id).delete();
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
