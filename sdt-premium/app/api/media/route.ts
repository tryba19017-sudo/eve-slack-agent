import { env } from "cloudflare:workers";
import { getEditorUser } from "@/app/editor-auth";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await getEditorUser();
  if (!user) return Response.json({ error: "Доступ запрещён" }, { status: 403 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Файл не выбран" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "Можно загружать только изображения" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "Максимальный размер файла — 10 МБ" }, { status: 413 });
  }

  const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
  const key = `site-images/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  await env.BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
    customMetadata: { uploadedBy: user.email, originalName: file.name.slice(0, 200) },
  });

  return Response.json({ url: `/media/${key}` });
}
