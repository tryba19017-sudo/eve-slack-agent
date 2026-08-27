import { env } from "cloudflare:workers";
import { defaultSiteContent, type SiteContent } from "@/app/site-content";
import { getEditorUser } from "@/app/editor-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const row = await env.DB.prepare(
    "SELECT content_json, updated_at FROM site_content WHERE id = ?",
  ).bind(1).first<{ content_json: string; updated_at: string }>();

  if (!row) {
    return Response.json({ content: defaultSiteContent, updatedAt: null });
  }

  try {
    return Response.json({ content: JSON.parse(row.content_json), updatedAt: row.updated_at });
  } catch {
    return Response.json({ content: defaultSiteContent, updatedAt: null });
  }
}

export async function PUT(request: Request) {
  const user = await getEditorUser();
  if (!user) return Response.json({ error: "Доступ запрещён" }, { status: 403 });

  const body = await request.json().catch(() => null) as { content?: SiteContent } | null;
  const content = body?.content;
  if (!content || content.version !== 1 || !Array.isArray(content.services) || !Array.isArray(content.blocks)) {
    return Response.json({ error: "Неверная структура данных" }, { status: 400 });
  }

  const contentJson = JSON.stringify(content);
  if (contentJson.length > 800_000) {
    return Response.json({ error: "Слишком большой объём данных" }, { status: 413 });
  }

  const updatedAt = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO site_content (id, content_json, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET content_json = excluded.content_json, updated_at = excluded.updated_at`,
  ).bind(1, contentJson, updatedAt).run();

  return Response.json({ ok: true, updatedAt });
}
