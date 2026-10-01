import { connectSlackCredentials } from "@vercel/connect/eve";
import { slackChannel } from "eve/channels/slack";

// SLACK_CONNECTOR is provisioned by the "Deploy with Vercel" button. To set it
// up yourself, create a connector with `vercel connect create slack --triggers`
// and put its UID in SLACK_CONNECTOR (or replace the fallback below).
//
// The Slack app needs the `files:read` scope to receive .docx attachments and
// `files:write` to send the reviewed document back.
export default slackChannel({
  credentials: connectSlackCredentials(
    process.env.SLACK_CONNECTOR ?? "slack/my-agent",
  ),
  events: {
    // Upload files the agent hands over with the `send_file` tool.
    async "action.result"(data, channel, ctx) {
      const result = data.result;
      if (data.status !== "completed" || result.kind !== "tool-result") return;
      if (result.toolName !== "send_file" || result.isError) return;
      const output = result.output as { path?: string; filename?: string; message?: string };
      if (!output?.path || !output.filename) return;

      const sandbox = await ctx.getSandbox();
      const bytes = await sandbox.readBinaryFile({ path: output.path });
      if (!bytes) {
        await channel.thread.post(`Could not find ${output.filename} to upload.`);
        return;
      }
      await channel.slack.uploadFiles([{ data: Buffer.from(bytes), filename: output.filename }], {
        initialComment: output.message,
      });
    },
  },
});
