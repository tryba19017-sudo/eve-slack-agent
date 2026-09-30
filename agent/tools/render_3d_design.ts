import { generateText } from "ai";
import { defineTool } from "eve/tools";
import { z } from "zod";

// Any AI Gateway model that accepts an image and returns image files works
// here. Override with IMAGE_MODEL, e.g. "google/gemini-3.1-flash-image".
const IMAGE_MODEL = process.env.IMAGE_MODEL ?? "google/gemini-3-pro-image";

const VIEWS = {
  isometric:
    "a photorealistic 3D isometric cutaway of the whole apartment seen from above at about 45 degrees, walls cut at door height so every room is visible, like a high-end architectural dollhouse visualization",
  top: "a photorealistic 3D top-down view of the whole apartment with the ceiling removed",
  room: "a photorealistic eye-level interior photograph of a single room, shot from a corner at 1.5 m height with a 20-24 mm lens, vertical lines perfectly straight",
} as const;

// Shared realism brief for every render: materials, light, and camera like a
// professional interior photo or Corona/V-Ray visualization.
const REALISM = [
  "Photorealistic interior visualization indistinguishable from a professional photograph (Corona Renderer / V-Ray quality).",
  "Physically accurate materials with real texture: visible wood grain, fabric weave, slight wrinkles on bedding and curtains, matte paint with subtle imperfections, realistic reflections on tile, glass and metal.",
  "Real-world furniture proportions and scale, with small lived-in details: books, a throw blanket, cushions, a vase, plants, framed art where appropriate.",
  "Natural daylight from the windows with soft shadows and ambient occlusion in corners, plus warm interior lamps; balanced exposure, no blown highlights.",
  "No text, labels, dimensions, watermarks, people, or cartoon or CGI look.",
].join(" ");

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
        "English description of the plan as you read it: rooms, their positions, sizes, doors, windows, finishes (walls, accent wall, floor), and the furniture to place in each room.",
      ),
    referencePath: z
      .string()
      .optional()
      .describe(
        "Optional sandbox path of a reference image the user sent (a 3D screenshot, a sketch, or an inspiration photo). The render keeps its camera angle and furniture layout, or its mood for an inspiration photo.",
      ),
  }),
  async execute({ planPath, view, room, style, layoutNotes, referencePath }, ctx) {
    const sandbox = await ctx.getSandbox();
    const plan = await sandbox.readBinaryFile({ path: planPath });
    if (!plan) {
      throw new Error(`Floor plan not found at ${planPath}. Ask the user to send the plan again.`);
    }
    const mediaTypeOf = (path: string) => {
      const p = path.toLowerCase();
      if (p.endsWith(".pdf")) return "application/pdf";
      if (p.endsWith(".png")) return "image/png";
      if (p.endsWith(".webp")) return "image/webp";
      return "image/jpeg";
    };
    const reference = referencePath ? await sandbox.readBinaryFile({ path: referencePath }) : null;

    const viewText =
      view === "room" && room ? `${VIEWS.room}: the ${room}` : VIEWS[view];
    const prompt = [
      "You are an interior designer and architectural visualizer.",
      `Using the first attached image, the apartment floor plan, create ${viewText}.`,
      "Follow the plan exactly: keep wall layout, room proportions, door and window positions.",
      reference
        ? "The second attached image is a reference from the user: keep its camera angle and furniture arrangement if it is a 3D view or sketch, or take its mood and materials if it is an inspiration photo."
        : "",
      `Interior style: ${style}.`,
      `Layout, finishes and furniture: ${layoutNotes}`,
      REALISM,
    ]
      .filter(Boolean)
      .join("\n");

    const result = await generateText({
      model: IMAGE_MODEL,
      abortSignal: ctx.abortSignal,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "file", data: plan, mediaType: mediaTypeOf(planPath) },
            ...(reference && referencePath
              ? [{ type: "file" as const, data: reference, mediaType: mediaTypeOf(referencePath) }]
              : []),
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
