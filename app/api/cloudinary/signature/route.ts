import { v2 as cloudinary } from "cloudinary";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(req: Request) {
  try {
    const session = req.headers
      .get("cookie")
      ?.split(";")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`))
      ?.slice(SESSION_COOKIE_NAME.length + 1);

    if (!session) {
      return Response.json({ error: "You must be signed in." }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const profileSnapshot = await adminDb.collection("users").doc(decoded.uid).get();
    const profile = profileSnapshot.data();

    if (!profileSnapshot.exists || profile?.role !== "admin") {
      return Response.json({ error: "Only admins can upload files." }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as { folder?: string; resourceType?: string };
    const folder = String(body.folder || "").trim();
    const resourceType = String(body.resourceType || "raw").trim();

    if (!folder) {
      return Response.json({ error: "Folder is required." }, { status: 400 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = {
      folder,
      timestamp
    };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET || "");

    return Response.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
      resourceType,
      timestamp,
      signature
    });
  } catch (error) {
    console.error("Cloudinary signature failed", error);
    return Response.json({ error: error instanceof Error ? error.message : "Signature failed" }, { status: 500 });
  }
}
