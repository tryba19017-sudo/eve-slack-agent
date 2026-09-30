import { defineTool } from "eve/tools";
import { z } from "zod";

// Physically based reference values for the metallic/roughness workflow.
// Base colors are linear-ish sRGB hex values commonly used as starting points;
// roughness is a typical range the artist should tune per asset.
const MATERIALS = {
  gold: { baseColor: "#FFC356", metallic: 1, roughness: [0.15, 0.35], ior: 0.47 },
  silver: { baseColor: "#FCFAF5", metallic: 1, roughness: [0.1, 0.3], ior: 0.15 },
  copper: { baseColor: "#FBD8B8", metallic: 1, roughness: [0.2, 0.4], ior: 0.27 },
  aluminum: { baseColor: "#F5F6F6", metallic: 1, roughness: [0.25, 0.5], ior: 1.44 },
  iron: { baseColor: "#C4C7C7", metallic: 1, roughness: [0.4, 0.7], ior: 2.95 },
  chrome: { baseColor: "#C4C5C5", metallic: 1, roughness: [0.02, 0.1], ior: 3.1 },
  brass: { baseColor: "#D6B97B", metallic: 1, roughness: [0.2, 0.45], ior: 0.44 },
  plastic_glossy: { baseColor: "#808080", metallic: 0, roughness: [0.05, 0.2], ior: 1.46 },
  plastic_matte: { baseColor: "#808080", metallic: 0, roughness: [0.5, 0.8], ior: 1.46 },
  rubber: { baseColor: "#1A1A1A", metallic: 0, roughness: [0.7, 0.95], ior: 1.52 },
  glass: { baseColor: "#FFFFFF", metallic: 0, roughness: [0, 0.05], ior: 1.5, transmission: 1 },
  water: { baseColor: "#FFFFFF", metallic: 0, roughness: [0, 0.05], ior: 1.33, transmission: 1 },
  diamond: { baseColor: "#FFFFFF", metallic: 0, roughness: [0, 0.02], ior: 2.42, transmission: 1 },
  wood_varnished: { baseColor: "#8B5A2B", metallic: 0, roughness: [0.2, 0.4], ior: 1.5 },
  wood_raw: { baseColor: "#A0784A", metallic: 0, roughness: [0.6, 0.85], ior: 1.5 },
  concrete: { baseColor: "#8A8A85", metallic: 0, roughness: [0.8, 0.95], ior: 1.5 },
  fabric: { baseColor: "#6E6E6E", metallic: 0, roughness: [0.8, 1], ior: 1.46, sheen: 0.5 },
  leather: { baseColor: "#5A3A28", metallic: 0, roughness: [0.4, 0.7], ior: 1.5 },
  ceramic: { baseColor: "#F2F2F0", metallic: 0, roughness: [0.05, 0.2], ior: 1.5, clearcoat: 0.5 },
  car_paint: { baseColor: "#8B0000", metallic: 0.5, roughness: [0.3, 0.5], ior: 1.5, clearcoat: 1 },
  skin: { baseColor: "#E0AC8C", metallic: 0, roughness: [0.35, 0.55], ior: 1.4, subsurface: 0.3 },
  snow: { baseColor: "#F5F7FA", metallic: 0, roughness: [0.6, 0.9], ior: 1.31, subsurface: 0.2 },
} as const;

type MaterialName = keyof typeof MATERIALS;
const names = Object.keys(MATERIALS) as [MaterialName, ...MaterialName[]];

// The runtime tool name comes from the filename, so the model sees this as
// `pbr_material`. Tool filenames must be snake_case ASCII.
export default defineTool({
  description:
    "Get reference PBR (metallic/roughness) values for a common real-world material: " +
    "base color, metallic, roughness range, IOR and extra lobes (transmission, clearcoat, sheen, subsurface).",
  inputSchema: z.object({ material: z.enum(names) }),
  async execute({ material }) {
    const m = MATERIALS[material];
    return {
      material,
      ...m,
      roughness: { min: m.roughness[0], max: m.roughness[1] },
      notes:
        m.metallic === 1
          ? "Metal: base color carries the reflectance tint; keep albedo bright (no dark metals below ~#B0B0B0 sRGB unless oxidized)."
          : "Dielectric: keep albedo roughly within 30–240 sRGB; F0 ≈ 4% for IOR 1.5.",
    };
  },
});
