import path from "node:path";

interface FileSandbox {
  readBinaryFile(options: { path: string }): PromiseLike<Uint8Array | null>;
  writeBinaryFile(options: { path: string; content: Uint8Array }): PromiseLike<void>;
}

export async function readSandboxFile(sandbox: FileSandbox, filePath: string): Promise<Uint8Array> {
  const bytes = await sandbox.readBinaryFile({ path: filePath });
  if (!bytes) {
    throw new Error(`File not found in the sandbox: ${filePath}. Slack attachments are under /workspace/attachments.`);
  }
  return bytes;
}

/** `/workspace/output/<name>_<suffix>.docx` next to the agent's other outputs. */
export function outputPathFor(inputPath: string, suffix: string): string {
  const base = path.basename(inputPath).replace(/\.docx$/i, "").replace(/_(reviewed|accepted|rejected)$/, "");
  return `/workspace/output/${base}_${suffix}.docx`;
}

export function assertDocx(filePath: string) {
  if (!/\.(docx|docm)$/i.test(filePath)) {
    throw new Error(`Expected a .docx file, got ${filePath}. Ask the user to save legacy .doc files as .docx.`);
  }
}
