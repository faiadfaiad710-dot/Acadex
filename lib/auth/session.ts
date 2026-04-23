"use server";

import { cookies } from "next/headers";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { UserProfile } from "@/lib/types";

export async function createSession(idToken: string) {
  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  const adminAuth = getAdminAuth();
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn / 1000
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) return null;

  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const profile = await adminDb.collection("users").doc(decoded.uid).get();
    if (!profile.exists) return null;
    return profile.data() as UserProfile;
  } catch {
    return null;
  }
}
