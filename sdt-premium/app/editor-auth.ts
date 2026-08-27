import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export async function getEditorUser() {
  const user = await getChatGPTUser();
  if (!user) return null;

  const editorEmail = String((env as unknown as Record<string, unknown>).SDT_EDITOR_EMAIL ?? "")
    .trim()
    .toLowerCase();

  if (!editorEmail || user.email.trim().toLowerCase() !== editorEmail) return null;
  return user;
}
