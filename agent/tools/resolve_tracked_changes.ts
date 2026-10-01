import { defineTool } from "eve/tools";
import { z } from "zod";
import { resolveRevisions, setTracking } from "../lib/docx-review.js";
import { assertDocx, outputPathFor, readSandboxFile } from "../lib/sandbox-files.js";

export default defineTool({
  description:
    "Accept or reject the tracked changes in a Word (.docx) file — all of them, or only those by " +
    "one author — and optionally switch Track Changes on or off. Writes a new file.",
  inputSchema: z.object({
    path: z.string().describe("Source .docx in the sandbox."),
    mode: z.enum(["accept", "reject", "none"]).describe("'none' only changes the Track Changes setting."),
    author: z.string().optional().describe("Only resolve revisions by this author (exact name from read_docx)."),
    track_changes: z.boolean().optional().describe("Turn Word's Track Changes on (true) or off (false)."),
    output_path: z.string().optional(),
  }),
  async execute({ path, mode, author, track_changes, output_path }, ctx) {
    assertDocx(path);
    const sandbox = await ctx.getSandbox();
    let bytes = await readSandboxFile(sandbox, path);
    let resolved = 0;
    let remaining: number | undefined;
    if (mode !== "none") {
      ({ bytes, resolved, remaining } = await resolveRevisions(bytes, { mode, author }));
    }
    if (track_changes !== undefined) bytes = await setTracking(bytes, track_changes);
    const outputPath =
      output_path ?? outputPathFor(path, mode === "accept" ? "accepted" : mode === "reject" ? "rejected" : "reviewed");
    await sandbox.writeBinaryFile({ path: outputPath, content: bytes });
    return { output_path: outputPath, resolved, remaining, track_changes };
  },
});
