import { defineTool } from "eve/tools";
import { z } from "zod";

// Scene conventions for common DCC tools and engines. metersPerUnit is the
// default scene unit; upAxis/handedness matter when exporting FBX/glTF.
const APPS = {
  blender: { metersPerUnit: 1, upAxis: "Z", handedness: "right" },
  maya: { metersPerUnit: 0.01, upAxis: "Y", handedness: "right" },
  "3dsmax": { metersPerUnit: 0.0254, upAxis: "Z", handedness: "right" },
  cinema4d: { metersPerUnit: 0.01, upAxis: "Y", handedness: "left" },
  houdini: { metersPerUnit: 1, upAxis: "Y", handedness: "right" },
  unity: { metersPerUnit: 1, upAxis: "Y", handedness: "left" },
  unreal: { metersPerUnit: 0.01, upAxis: "Z", handedness: "left" },
  threejs: { metersPerUnit: 1, upAxis: "Y", handedness: "right" },
  gltf: { metersPerUnit: 1, upAxis: "Y", handedness: "right" },
} as const;

type App = keyof typeof APPS;
const apps = Object.keys(APPS) as [App, ...App[]];

export default defineTool({
  description:
    "Convert a size between the default scene units of 3D apps/engines (Blender, Maya, 3ds Max, " +
    "Cinema 4D, Houdini, Unity, Unreal, three.js, glTF) and report up-axis/handedness differences " +
    "to fix scale and rotation issues on export/import.",
  inputSchema: z.object({
    from: z.enum(apps),
    to: z.enum(apps),
    value: z.number().describe("Size in the source app's default units").default(1),
  }),
  async execute({ from, to, value }) {
    const a = APPS[from];
    const b = APPS[to];
    const scale = a.metersPerUnit / b.metersPerUnit;
    return {
      from: { app: from, ...a },
      to: { app: to, ...b },
      value,
      converted: Number((value * scale).toPrecision(6)),
      scaleFactor: Number(scale.toPrecision(6)),
      meters: value * a.metersPerUnit,
      axisChange: a.upAxis !== b.upAxis ? `${a.upAxis}-up → ${b.upAxis}-up (rotate 90° about X on export or use exporter axis settings)` : null,
      handednessChange: a.handedness !== b.handedness,
    };
  },
});
