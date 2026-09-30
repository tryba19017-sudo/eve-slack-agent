import { defineTool } from "eve/tools";
import { z } from "zod";

// Rule-of-thumb budgets per target platform and asset role. Triangles, not
// quads. Texture size is the recommended max for the main material set.
const BUDGETS = {
  mobile: { hero: [10_000, 30_000], prop: [300, 3_000], environment: [50_000, 150_000], texture: 1024, materials: 1 },
  web: { hero: [20_000, 60_000], prop: [500, 5_000], environment: [100_000, 300_000], texture: 2048, materials: 2 },
  vr: { hero: [20_000, 50_000], prop: [500, 5_000], environment: [100_000, 500_000], texture: 2048, materials: 2 },
  console: { hero: [60_000, 150_000], prop: [2_000, 15_000], environment: [1_000_000, 5_000_000], texture: 4096, materials: 3 },
  pc: { hero: [80_000, 200_000], prop: [2_000, 20_000], environment: [2_000_000, 10_000_000], texture: 4096, materials: 4 },
  cinematic: { hero: [500_000, 5_000_000], prop: [20_000, 200_000], environment: [10_000_000, 100_000_000], texture: 8192, materials: 8 },
} as const;

export default defineTool({
  description:
    "Get recommended triangle count, texture resolution and material slot budgets for a 3D asset " +
    "on a target platform (mobile, web, vr, console, pc, cinematic). Also suggests LOD steps.",
  inputSchema: z.object({
    platform: z.enum(["mobile", "web", "vr", "console", "pc", "cinematic"]),
    role: z.enum(["hero", "prop", "environment"]).describe(
      "hero = main character/product, prop = secondary object, environment = whole scene",
    ),
  }),
  async execute({ platform, role }) {
    const b = BUDGETS[platform];
    const [min, max] = b[role];
    const lods =
      platform === "cinematic"
        ? []
        : [1, 0.5, 0.25, 0.1].map((ratio, i) => ({ lod: i, triangles: Math.round(max * ratio) }));
    return {
      platform,
      role,
      triangles: { min, max },
      maxTextureSize: role === "prop" ? b.texture / 2 : b.texture,
      maxMaterialSlots: b.materials,
      lods,
      texelDensityPxPerMeter: { mobile: 256, web: 512, vr: 512, console: 1024, pc: 1024, cinematic: 2048 }[platform],
    };
  },
});
