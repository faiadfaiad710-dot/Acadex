import { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { normalizePhone, phoneToLoginEmail } from "@/lib/auth/phone";

type StaffRole = "admin" | "manager" | "user";

async function getMobileUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new Error("Unauthorized");
  }

  const decoded = await getAdminAuth().verifyIdToken(token);
  const profile = await getAdminDb().collection("users").doc(decoded.uid).get();
  const data = profile.data() || {};
  const role = String(data.role || decoded.role || "user") as StaffRole;

  return {
    uid: decoded.uid,
    email: String(data.email || decoded.email || ""),
    role
  };
}

function requireStaff(role: StaffRole) {
  if (role !== "admin" && role !== "manager") {
    throw new Error("Only admins and managers can do this.");
  }
}

function requireAdmin(role: StaffRole) {
  if (role !== "admin") {
    throw new Error("Only admins can do this.");
  }
}

function text(value: unknown) {
  return String(value || "").trim();
}

export async function POST(req: NextRequest) {
  try {
    const user = await getMobileUser(req);
    const { action, payload = {} } = (await req.json()) as {
      action?: string;
      payload?: Record<string, unknown>;
    };
    const db = getAdminDb();

    if (action === "saveRoutine") {
      requireStaff(user.role);
      const subjectId = text(payload.subjectId);
      const day = text(payload.day);
      const startTime = text(payload.startTime);
      if (!subjectId || !day || !startTime) {
        return Response.json({ error: "Select subject, day, and class time." }, { status: 400 });
      }

      const [subjectDoc, teacherDoc] = await Promise.all([
        db.collection("subjects").doc(subjectId).get(),
        text(payload.teacherId) ? db.collection("teachers").doc(text(payload.teacherId)).get() : Promise.resolve(null)
      ]);
      const subjectName = String(subjectDoc.data()?.name || "");
      if (!subjectName) {
        return Response.json({ error: "Selected subject was not found." }, { status: 400 });
      }
      const teacherName = String(teacherDoc?.data()?.name || text(payload.teacherName));
      const routinePayload = {
        subjectId,
        subjectName,
        day,
        startTime,
        endTime: text(payload.endTime),
        room: text(payload.room),
        teacherId: text(payload.teacherId),
        teacherName,
        note: text(payload.note)
      };

      const id = text(payload.id);
      if (id) {
        await db.collection("classRoutines").doc(id).set(routinePayload, { merge: true });
        return Response.json({ ok: true, id, message: "Class updated." });
      }

      const ref = await db.collection("classRoutines").add({
        ...routinePayload,
        createdAt: new Date().toISOString()
      });
      return Response.json({ ok: true, id: ref.id, message: "Class added." });
    }

    if (action === "saveExam") {
      requireStaff(user.role);
      const kind = text(payload.kind) === "event" ? "event" : "exam";
      const title = text(payload.title);
      const examDate = text(payload.examDate);
      const subjectId = text(payload.subjectId);
      if (!title || !examDate) {
        return Response.json({ error: "Add title and date." }, { status: 400 });
      }
      let subjectName = "General Event";
      if (kind === "exam") {
        if (!subjectId) {
          return Response.json({ error: "Select a subject for exam." }, { status: 400 });
        }
        const subjectDoc = await db.collection("subjects").doc(subjectId).get();
        subjectName = String(subjectDoc.data()?.name || "");
        if (!subjectName) {
          return Response.json({ error: "Selected subject was not found." }, { status: 400 });
        }
      }

      const examPayload = {
        kind,
        title,
        subjectId: kind === "exam" ? subjectId : "",
        subjectName,
        examDate,
        startTime: text(payload.startTime),
        room: text(payload.room),
        note: text(payload.note)
      };
      const id = text(payload.id);
      if (id) {
        await db.collection("exams").doc(id).set(examPayload, { merge: true });
        return Response.json({ ok: true, id, message: `${kind === "event" ? "Event" : "Exam"} updated.` });
      }

      const ref = await db.collection("exams").add({
        ...examPayload,
        createdAt: new Date().toISOString()
      });
      return Response.json({ ok: true, id: ref.id, message: `${kind === "event" ? "Event" : "Exam"} added.` });
    }

    if (action === "createUser") {
      requireAdmin(user.role);
      const phone = normalizePhone(text(payload.phone || payload.loginId));
      const password = text(payload.password);
      const role = ["admin", "manager", "user"].includes(text(payload.role)) ? text(payload.role) : "user";
      if (!phone || password.length < 6) {
        return Response.json({ error: "Roll number and 6 digit password are required." }, { status: 400 });
      }

      const loginEmail = phoneToLoginEmail(phone);
      const auth = getAdminAuth();
      const existingUser = await auth.getUserByEmail(loginEmail).catch(() => null);
      const userRecord = existingUser
        ? await auth.updateUser(existingUser.uid, { email: loginEmail, password })
        : await auth.createUser({ email: loginEmail, password });

      await auth.setCustomUserClaims(userRecord.uid, { role });
      await db.collection("users").doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: loginEmail,
        phone,
        loginId: phone,
        role,
        mustChangePassword: true,
        createdAt: new Date().toISOString()
      });

      return Response.json({ ok: true, id: userRecord.uid, message: "User saved." });
    }

    return Response.json({ error: "Unknown mobile management action." }, { status: 400 });
  } catch (error) {
    console.error("Mobile management action failed", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Action failed." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
