import { NextRequest } from "next/server";
import {
  analyzeCorpusItemWithOpenAi,
  checkAiRateLimit,
  findCorpusItem,
  getCachedAiResponse,
  getOpenAiKeyForUser,
  hashText,
  logAiUsage,
  setCachedAiResponse
} from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth/session";
import { AiSourceType } from "@/lib/types";

export const runtime = "nodejs";

const sourceTypes: AiSourceType[] = ["file", "resource", "notice", "lab", "teacher", "subject"];

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { sourceType?: AiSourceType; id?: string; language?: "auto" | "en" | "bn" };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const sourceType = body.sourceType;
  const id = body.id?.trim();
  const language = body.language || "auto";

  if (!sourceType || !sourceTypes.includes(sourceType) || !id) {
    return Response.json({ error: "Valid sourceType and id are required." }, { status: 400 });
  }

  try {
    await checkAiRateLimit(user.uid, "analysis");
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "AI rate limit reached." }, { status: 429 });
  }

  const item = await findCorpusItem(sourceType, id);
  if (!item) return Response.json({ error: "Resource was not found." }, { status: 404 });

  const cacheKey = hashText(`analysis:${language}:${sourceType}:${id}:${item.updatedAt || ""}:${item.text}`);
  const cached = await getCachedAiResponse(cacheKey);
  if (cached) {
    await logAiUsage({ user, action: "analysis", sourceId: id, sourceType, prompt: item.title, resultCount: 1 });
    return Response.json({ analysis: cached, cached: true });
  }

  const apiKey = await getOpenAiKeyForUser(user.uid);
  if (!apiKey) {
    return Response.json(
      { error: "AI mode is not configured. Add OPENAI_API_KEY or connect your personal key in Settings." },
      { status: 503 }
    );
  }

  try {
    const analysis = await analyzeCorpusItemWithOpenAi({ apiKey, item, language });
    await setCachedAiResponse(cacheKey, analysis, 168);
    await logAiUsage({ user, action: "analysis", sourceId: id, sourceType, prompt: item.title, resultCount: 1 });
    return Response.json({ analysis, cached: false });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "AI analysis failed." },
      { status: 500 }
    );
  }
}
