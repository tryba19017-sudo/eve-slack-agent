import { defineTool } from "eve/tools";
import { z } from "zod";
import { readDocx } from "../lib/docx-review.js";
import { assertDocx, readSandboxFile } from "../lib/sandbox-files.js";

export default defineTool({
  description:
    "Read a Word (.docx) file from the sandbox: numbered paragraphs, existing tracked changes " +
    "(shown inline as [+inserted+] and [-deleted-]), and comments. Call before review_docx so " +
    "`find` strings match the document exactly.",
  inputSchema: z.object({
    path: z.string().describe("Sandbox path, e.g. /workspace/attachments/contract.docx"),
    start: z.number().int().min(0).default(0).describe("First paragraph index to return."),
    limit: z.number().int().min(1).max(1000).default(400).describe("Max paragraphs to return."),
  }),
  async execute({ path, start, limit }, ctx) {
    assertDocx(path);
    const sandbox = await ctx.getSandbox();
    const overview = await readDocx(await readSandboxFile(sandbox, path));
    const paragraphs = overview.paragraphs.slice(start, start + limit);
    return {
      path,
      paragraphCount: overview.paragraphCount,
      returned: { from: start, to: start + paragraphs.length - 1 },
      trackRevisionsEnabled: overview.trackRevisionsEnabled,
      paragraphs: paragraphs
        .filter((p) => p.text.trim() !== "")
        .map((p) => ({
          i: p.index,
          text: p.text,
          ...(p.style ? { style: p.style } : {}),
          ...(p.inTable ? { table: true } : {}),
        })),
      comments: overview.comments,
      revisions: overview.revisions,
    };
  },
});
