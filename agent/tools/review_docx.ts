import { defineTool } from "eve/tools";
import { z } from "zod";
import { applyReview, type ReviewOperation } from "../lib/docx-review.js";
import { assertDocx, outputPathFor, readSandboxFile } from "../lib/sandbox-files.js";

const located = {
  find: z
    .string()
    .min(1)
    .describe("Exact text copied from read_docx, inside one paragraph. Include enough words to be unique."),
  paragraph: z.number().int().min(0).optional().describe("Limit the search to this paragraph index."),
  occurrence: z.number().int().min(1).optional().describe("1-based match to use when `find` repeats."),
};
const comment = z.string().min(1).optional().describe("Optional margin comment explaining the change.");

const operation = z.discriminatedUnion("action", [
  z.object({ action: z.literal("replace"), ...located, replace: z.string().min(1), comment }),
  z.object({ action: z.literal("delete"), ...located, comment }),
  z.object({
    action: z.literal("insert"),
    ...located,
    position: z.enum(["before", "after"]),
    text: z.string().min(1),
    comment,
  }),
  z.object({ action: z.literal("comment"), ...located, comment: z.string().min(1) }),
  z.object({
    action: z.literal("insert_paragraph"),
    paragraph: z.number().int().min(0),
    position: z.enum(["before", "after"]),
    text: z.string().min(1),
    comment,
  }),
  z.object({ action: z.literal("delete_paragraph"), paragraph: z.number().int().min(0), comment }),
]);

export default defineTool({
  description:
    "Edit a Word (.docx) file in review mode: every change is written as a tracked change " +
    "(Track Changes) the author can accept or reject in Word, optionally with a margin comment. " +
    "Supports replace, delete, insert (before/after a phrase), comment-only, insert_paragraph and " +
    "delete_paragraph. Keep each `find` as short as possible while unique, so the redline shows " +
    "only the words that actually change. Writes a new file and leaves the original untouched.",
  inputSchema: z.object({
    path: z.string().describe("Source .docx in the sandbox."),
    operations: z.array(operation).min(1).max(300),
    author: z
      .string()
      .min(1)
      .optional()
      .describe("Reviewer name shown in Word. Defaults to REVIEW_AUTHOR or 'Eve'."),
    initials: z.string().optional(),
    enable_tracking: z
      .boolean()
      .default(true)
      .describe("Also switch Word's Track Changes on so later edits by the recipient are tracked."),
    output_path: z.string().optional().describe("Defaults to /workspace/output/<name>_reviewed.docx"),
  }),
  async execute(input, ctx) {
    assertDocx(input.path);
    const sandbox = await ctx.getSandbox();
    const source = await readSandboxFile(sandbox, input.path);
    const { bytes, results } = await applyReview(source, input.operations as ReviewOperation[], {
      author: input.author ?? process.env.REVIEW_AUTHOR ?? "Eve",
      initials: input.initials,
      enableTracking: input.enable_tracking,
    });
    const outputPath = input.output_path ?? outputPathFor(input.path, "reviewed");
    await sandbox.writeBinaryFile({ path: outputPath, content: bytes });
    const failed = results.filter((r) => !r.ok);
    return {
      output_path: outputPath,
      applied: results.length - failed.length,
      failed: failed.length,
      results,
      ...(failed.length
        ? {
            hint:
              "Fix the failed operations and call review_docx again on output_path (not the original) " +
              "with only those operations.",
          }
        : {}),
    };
  },
});
