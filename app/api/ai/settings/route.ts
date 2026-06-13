import { NextRequest } from "next/server";
import { clearOpenAiKey, getOpenAiKeyStatus, saveOpenAiKey } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await getOpenAiKeyStatus(user.uid));
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { apiKey?: string; clear?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.clear) {
    await clearOpenAiKey(user.uid);
    return Response.json({ ok: true, hasPersonalKey: false });
  }

  const apiKey = body.apiKey?.trim() || "";
  if (!apiKey.startsWith("sk-")) {
    return Response.json({ error: "Enter a valid OpenAI API key." }, { status: 400 });
  }

  await saveOpenAiKey(user.uid, apiKey);
  return Response.json({ ok: true, hasPersonalKey: true });
}
