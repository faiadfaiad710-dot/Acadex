import { AiAssistant } from "@/components/ai/ai-assistant";
import { requireUser } from "@/lib/auth/guards";

export default async function AiPage() {
  await requireUser();
  return <AiAssistant />;
}
