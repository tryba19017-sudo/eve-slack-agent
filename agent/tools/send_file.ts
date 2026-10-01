import path from "node:path";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { readSandboxFile } from "../lib/sandbox-files.js";

// The Slack channel's `action.result` handler (agent/channels/slack.ts) picks
// up this tool's result and uploads the file to the thread, so the bytes never
// pass through the model or session history.
export default defineTool({
  description:
    "Send a file from the sandbox to the user in the current conversation (uploads it to the Slack thread).",
  inputSchema: z.object({
    path: z.string().describe("Sandbox path of the file, e.g. /workspace/output/contract_reviewed.docx"),
    message: z.string().optional().describe("Short note shown above the file."),
  }),
  async execute({ path: filePath, message }, ctx) {
    const sandbox = await ctx.getSandbox();
    const bytes = await readSandboxFile(sandbox, filePath);
    return { path: filePath, filename: path.basename(filePath), size: bytes.byteLength, message };
  },
});
