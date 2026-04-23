"use server";

import { revalidatePath } from "next/cache";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { clearSession, createSession, getCurrentUser } from "@/lib/auth/session";

export async function signInWithTokenAction(idToken: string) {
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
