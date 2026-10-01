import { defineChannel, GET, POST } from "eve/channels";
import { httpBasic, localDev, routeAuth, type AuthFn } from "eve/channels/auth";
import {
  applyReview,
  readDocx,
  resolveRevisions,
  setTracking,
  type ReviewOperation,
} from "../lib/docx-review.js";
import { editorPage } from "../lib/editor-page.js";

// Browser editor for Word review mode: open a .docx at /editor, edit it like
// plain text, and every change is saved as a tracked change. The server is
// stateless — the page keeps the current file and sends it with each request.
//
// Production access requires EDITOR_PASSWORD (HTTP Basic, user "editor" or
// EDITOR_USER). Without it the editor only answers under `eve dev`.

const auth: AuthFn<Request>[] = [localDev()];
if (process.env.EDITOR_PASSWORD) {
  auth.unshift(
    httpBasic(
      { username: process.env.EDITOR_USER ?? "editor", password: process.env.EDITOR_PASSWORD },
      { realm: "Word review editor" },
    ),
  );
}

async function guarded(request: Request, handler: () => Promise<Response>): Promise<Response> {
  const result = await routeAuth(request, auth);
  if (result instanceof Response) return result;
  try {
    return await handler();
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}

async function fileFrom(form: FormData): Promise<Uint8Array> {
  const file = form.get("file");
  if (!file || typeof file === "string") throw new Error("Attach a .docx file.");
  return new Uint8Array(await file.arrayBuffer());
}

async function documentResponse(bytes: Uint8Array, extra: Record<string, unknown> = {}) {
  return Response.json({
    ok: true,
    ...extra,
    document: await readDocx(bytes),
    docx: Buffer.from(bytes).toString("base64"),
  });
}

export default defineChannel({
  routes: [
    GET("/editor", (request) =>
      guarded(request, async () =>
        new Response(editorPage, {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
        }),
      ),
    ),

    POST("/editor/api/open", (request) =>
      guarded(request, async () => documentResponse(await fileFrom(await request.formData()))),
    ),

    POST("/editor/api/apply", (request) =>
      guarded(request, async () => {
        const form = await request.formData();
        const operations = JSON.parse(String(form.get("operations") ?? "[]")) as ReviewOperation[];
        const { bytes, results } = await applyReview(await fileFrom(form), operations, {
          author: String(form.get("author") || "Рецензент"),
          enableTracking: true,
        });
        return documentResponse(bytes, { results });
      }),
    ),

    POST("/editor/api/resolve", (request) =>
      guarded(request, async () => {
        const form = await request.formData();
        const mode = String(form.get("mode"));
        let bytes = await fileFrom(form);
        if (mode === "accept" || mode === "reject") {
          ({ bytes } = await resolveRevisions(bytes, {
            mode,
            author: form.get("author") ? String(form.get("author")) : undefined,
          }));
        } else if (mode === "tracking-on" || mode === "tracking-off") {
          bytes = await setTracking(bytes, mode === "tracking-on");
        } else {
          throw new Error(`Unknown mode: ${mode}`);
        }
        return documentResponse(bytes);
      }),
    ),
  ],
});
