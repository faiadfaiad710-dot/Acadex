import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { createSession } from "@/lib/auth/session";
import { normalizePhone } from "@/lib/auth/phone";

export async function establishSessionFromIdToken(idToken: string) {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();
  const decoded = await adminAuth.verifyIdToken(idToken);
  const userRef = adminDb.collection("users").doc(decoded.uid);
  const userSnapshot = await userRef.get();

  if (!userSnapshot.exists) {
    const authUser = await adminAuth.getUser(decoded.uid);
    const loginEmail = authUser.email || decoded.email || "";
    const role = decoded.role === "admin" ? "admin" : "user";
    const maybePhone =
      authUser.phoneNumber ||
      (loginEmail.endsWith("@phone.academic.local")
        ? loginEmail.replace("@phone.academic.local", "").replace(/^plus/, "+")
        : "");

    await userRef.set({
      uid: decoded.uid,
      email: loginEmail,
      phone: maybePhone ? normalizePhone(maybePhone) : "",
      loginId: maybePhone ? normalizePhone(maybePhone) : loginEmail,
      role,
      mustChangePassword: false,
      createdAt: new Date().toISOString()
    });
  }

  await createSession(idToken);
  const profile = await userRef.get();
  return { uid: decoded.uid, ...(profile.data() || {}) };
}
