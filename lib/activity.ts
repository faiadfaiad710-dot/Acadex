import { getAdminDb } from "@/lib/firebase/admin";
import { UserProfile } from "@/lib/types";

function identifierFromEmail(email?: string) {
  const value = String(email || "").trim().toLowerCase();
  if (value.endsWith("@phone.academic.local")) {
    return value.replace("@phone.academic.local", "");
  }
  return "";
}

function userLabel(user: UserProfile) {
  return user.loginId || user.phone || identifierFromEmail(user.email) || user.email || user.uid || "Unknown user";
}

export async function recordSubjectActivity({
  user,
  subjectId,
  subjectName,
  action,
  itemId,
  itemType
}: {
  user: UserProfile;
  subjectId: string;
  subjectName: string;
  action: "subject_enter" | "file_open" | "file_download";
  itemId?: string;
  itemType?: "file" | "resource";
}) {
  if (!user?.uid || !subjectId || !subjectName) {
    return;
  }

  await getAdminDb()
    .collection("activityLogs")
    .add({
      uid: user.uid,
      userLabel: userLabel(user),
      subjectId,
      subjectName,
      action,
      itemId: itemId || "",
      itemType: itemType || "",
      createdAt: new Date().toISOString()
    })
    .catch(() => null);
}
