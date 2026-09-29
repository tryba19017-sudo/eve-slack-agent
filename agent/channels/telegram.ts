import { resolveTelegramBotToken, telegramChannel } from "eve/channels/telegram";

// Needs TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET_TOKEN (see README).
export default telegramChannel({
  botUsername: process.env.TELEGRAM_BOT_USERNAME,
  uploadPolicy: {
    allowedMediaTypes: ["image/*", "application/pdf"],
    maxBytes: 20 * 1024 * 1024,
  },
  events: {
    async "actions.requested"(data, channel) {
      const rendering = data.actions.some(
        (a) => a.kind === "tool-call" && a.toolName === "render_3d_design",
      );
      await channel.telegram.startTyping(rendering ? "upload_photo" : "typing");
    },
    // Rendered images live in the sandbox; send them to the chat as photos.
    async "action.result"(data, channel, ctx) {
      const { result } = data;
      if (
        result.kind !== "tool-result" ||
        result.toolName !== "render_3d_design" ||
        result.isError
      ) {
        return;
      }
      const output = result.output as { path: string; mediaType: string; caption: string };
      const sandbox = await ctx.getSandbox();
      const bytes = await sandbox.readBinaryFile({ path: output.path });
      if (!bytes) return;

      await sendTelegramPhoto({
        chatId: channel.telegram.chatId,
        messageThreadId: channel.telegram.messageThreadId,
        bytes,
        mediaType: output.mediaType,
        caption: output.caption,
      });
    },
  },
});

// The channel's `request` helper only speaks JSON, so photo uploads go through
// Telegram's multipart `sendPhoto` endpoint directly.
async function sendTelegramPhoto(input: {
  chatId: string;
  messageThreadId?: number;
  bytes: Uint8Array;
  mediaType: string;
  caption?: string;
}): Promise<void> {
  const token = await resolveTelegramBotToken();
  const ext = input.mediaType.split("/")[1] ?? "png";
  const form = new FormData();
  form.set("chat_id", input.chatId);
  if (input.messageThreadId !== undefined) {
    form.set("message_thread_id", String(input.messageThreadId));
  }
  if (input.caption) {
    // Telegram caps photo captions at 1024 characters.
    form.set("caption", input.caption.slice(0, 1024));
  }
  form.set(
    "photo",
    new Blob([new Uint8Array(input.bytes)], { type: input.mediaType }),
    `render.${ext}`,
  );

  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Telegram sendPhoto failed: ${res.status} ${await res.text()}`);
  }
}
