"use server";

import { revalidatePath } from "next/cache";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { clearSession, createSession, getCurrentUser } from "@/lib/auth/session";
import { normalizePhone } from "@/lib/auth/phone";

export async function signInWithTokenAction(idToken: string) {
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
  revalidatePath("/");
}

export async function signOutAction() {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    const adminAuth = getAdminAuth();
    await adminAuth.revokeRefreshTokens(currentUser.uid);
  }
  await clearSession();
  revalidatePath("/");
}

export async function updatePasswordRequirementAction(newPassword: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const adminDb = getAdminDb();
  await adminDb.collection("users").doc(user.uid).set(
    {
      mustChangePassword: false
    },
    { merge: true }
  );

  revalidatePath("/profile");
  return { ok: true, password: newPassword };
}
