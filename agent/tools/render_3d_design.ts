import { generateText } from "ai";
import { defineTool } from "eve/tools";
import { z } from "zod";

// Any AI Gateway model that accepts an image and returns image files works
// here. Override with IMAGE_MODEL, e.g. "google/gemini-3.1-flash-image".
const IMAGE_MODEL = process.env.IMAGE_MODEL ?? "google/gemini-3-pro-image";

const VIEWS = {
  isometric:
    "a 3D isometric cutaway view of the whole apartment from above at about 45 degrees, walls cut at mid-height so every room is visible",
  top: "a photorealistic 3D top-down view of the whole apartment with the roof removed",
  room: "a photorealistic eye-level interior render of a single room, as if photographed with a wide-angle lens",
} as const;

export default defineTool({
  description:
    "Render a 3D interior design visualization from an apartment floor plan image. " +
    "The image is generated and sent to the user's chat automatically; do not repeat it in text.",
  inputSchema: z.object({
    planPath: z
      .string()
      .describe("Sandbox path of the floor plan attachment, e.g. /workspace/attachments/…"),
    view: z.enum(["isometric", "top", "room"]).default("isometric"),
    room: z
      .string()
      .optional()
      .describe("For view=room: which room to render, e.g. 'kitchen-living room'."),
    style: z
      .string()
      .describe("Interior style in English, e.g. 'Scandinavian, light oak, white walls'."),
    layoutNotes: z
      .string()
      .describe(
        "English description of the plan as you read it: rooms, their positions, sizes, doors, windows, and the furniture to place in each room.",
      ),
  }),
  async execute({ planPath, view, room, style, layoutNotes }, ctx) {
    const sandbox = await ctx.getSandbox();
    const plan = await sandbox.readBinaryFile({ path: planPath });
    if (!plan) {
      throw new Error(`Floor plan not found at ${planPath}. Ask the user to send the plan again.`);
    }
    const planMediaType = planPath.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : planPath.toLowerCase().endsWith(".png")
        ? "image/png"
        : "image/jpeg";

    const viewText =
      view === "room" && room ? `${VIEWS.room}: the ${room}` : VIEWS[view];
    const prompt = [
      "You are an interior designer and 3D visualizer.",
      `Using the attached apartment floor plan, create ${viewText}.`,
      "Follow the plan exactly: keep wall layout, room proportions, door and window positions.",
      `Interior style: ${style}.`,
      `Layout and furniture: ${layoutNotes}`,
      "Realistic materials, soft daylight, high detail, no text, labels, or dimensions on the image.",
    ].join("\n");

    const result = await generateText({
      model: IMAGE_MODEL,
      abortSignal: ctx.abortSignal,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "file", data: plan, mediaType: planMediaType },
          ],
        },
      ],
    });

    const image = result.files.find((f) => f.mediaType.startsWith("image/"));
    if (!image) {
      throw new Error(`The image model returned no image. Model said: ${result.text.slice(0, 300)}`);
    }

    // The Telegram channel's action.result handler reads this file and sends it.
    const ext = image.mediaType.split("/")[1] ?? "png";
    const path = `/workspace/renders/${ctx.callId}.${ext}`;
    await sandbox.writeBinaryFile({ path, content: image.uint8Array });

    const caption = view === "room" && room ? `${room} — ${style}` : `${view} — ${style}`;
    return { path, mediaType: image.mediaType, caption };
  },
  toModelOutput(output) {
    return {
      type: "text",
      value: `Render sent to the user (${output.caption}).`,
    };
  },
});
