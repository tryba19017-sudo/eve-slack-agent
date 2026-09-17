import { defineTool } from "eve/tools";
import { z } from "zod";
import { mergeDraft, proposalDraft } from "../lib/draft";
import { takeoffFromPieces } from "../lib/takeoff";

const pieceSchema = z.object({
  name: z.string().optional(),
  lengthMm: z.number().positive(),
  widthMm: z.number().positive(),
  quantity: z.number().int().positive(),
  layers: z.number().int().positive().optional(),
});

export default defineTool({
  description:
    "Sum lamella running meters and tape area from a reinforcement sketch BOM (length mm, width mm, piece count). Saves the takeoff on the session draft. Tape area uses L×b×qty×layers; default layers=1.",
  inputSchema: z.object({
    lamellas: z.array(pieceSchema).optional(),
    tapes: z.array(pieceSchema).optional(),
    wallAreaM2: z.number().positive().optional(),
    tapeAreaOverrideM2: z
      .number()
      .positive()
      .optional()
      .describe(
        "Use when the estimate sheet lists холст in m² that does not equal L×b of the hoops.",
      ),
  }),
  async execute(input) {
    const result = takeoffFromPieces({
      lamellas: input.lamellas,
      tapes: input.tapes,
    });
    const tapeM2 = input.tapeAreaOverrideM2 ?? result.tapeM2FromStrips;

    proposalDraft.update((current) =>
      mergeDraft(current, {
        takeoff: {
          wallAreaM2: input.wallAreaM2 ?? current.takeoff.wallAreaM2,
          lamellaM: result.lamellaM || current.takeoff.lamellaM,
          tapeM2,
          lamellas: input.lamellas,
          tapes: input.tapes,
        },
      }),
    );

    return {
      ...result,
      wallAreaM2: input.wallAreaM2,
      tapeM2UsedForEstimate: tapeM2,
      hint:
        tapeM2 !== result.tapeM2FromStrips
          ? "Для сметы взята площадь холста с листа расчёта, не L×b хомутов."
          : "Площадь холста посчитана как L×b заготовок. Если в смете другая м² — передайте tapeAreaOverrideM2.",
    };
  },
});
