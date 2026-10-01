// Builds the browser editor as one self-contained HTML file that needs no
// server: the docx library (with JSZip and xmldom) is inlined into the page.
//
//   pnpm build:standalone            → standalone/review-editor.html
//   pnpm build:standalone --artifact → also prints a body-only variant path
import { build } from "esbuild";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

async function bundle(contents, globalName) {
  const result = await build({
    stdin: { contents, resolveDir: root, sourcefile: "entry.ts", loader: "ts" },
    bundle: true,
    format: "iife",
    globalName,
    platform: "browser",
    target: "es2019",
    minify: true,
    write: false,
  });
  return result.outputFiles[0].text;
}

const library = await bundle(
  `export { applyReview, readDocx, resolveRevisions, setTracking } from "./agent/lib/docx-review.ts";`,
  "DocxReview",
);
const pageModule = await bundle(`export { editorPage } from "./agent/lib/editor-page.ts";`, "EditorPage");
const { editorPage } = new Function(`${pageModule}; return EditorPage;`)();

const inlineLibrary = `<script>${library.replace(/<\/script/gi, () => "<\\/script")}</script>\n`;
// A function replacement keeps "$&"-like sequences in the minified code literal.
const page = editorPage.replace("<script>\n(function () {", () => `${inlineLibrary}<script>\n(function () {`);
if (page === editorPage) throw new Error("Could not find the page script to inline the library before.");

mkdirSync(`${root}/standalone`, { recursive: true });
writeFileSync(`${root}/standalone/review-editor.html`, page);

if (process.argv.includes("--artifact")) {
  // Artifact publishing wraps the page in its own document skeleton.
  const body = page
    .replace(/^<!doctype html>\s*<html[^>]*>\s*<head>\s*/i, "")
    .replace(/<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*/i, "")
    .replace(/<\/head>\s*<body>\s*/i, "")
    .replace(/\s*<\/body>\s*<\/html>\s*$/i, "\n");
  const out = process.argv[process.argv.indexOf("--artifact") + 1] ?? `${root}/standalone/artifact.html`;
  writeFileSync(out, body);
  console.log(out);
}
console.log(`standalone/review-editor.html (${Math.round(page.length / 1024)} KB)`);
