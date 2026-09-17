import { defineTool } from "eve/tools";
import { z } from "zod";
import { WORK_CODES } from "../lib/catalog";
import { listMissingFields, mergeDraft, proposalDraft } from "../lib/draft";
import { calculateEstimate, standardCfrpPackage } from "../lib/estimate";

export default defineTool({
  description:
    "Calculate an SDT CFRP estimate: labor + 30% overhead + materials from catalog norms, VAT 22%. Uses the standard package (prep, repair, lamella, tape, fire) from takeoff volumes unless explicit work items are passed.",
  inputSchema: z.object({
    items: z
      .array(
        z.object({
          workCode: z.enum(WORK_CODES),
          quantity: z.number().positive(),
          note: z.string().optional(),
        }),
      )
      .optional(),
    wallAreaM2: z.number().positive().optional(),
    lamellaM: z.number().positive().optional(),
    tapeM2: z.number().positive().optional(),
    vatMode: z.enum(["none", "added"]).optional(),
  }),
  async execute(input) {
    const draft = proposalDraft.get();
    const wallAreaM2 = input.wallAreaM2 ?? draft.takeoff.wallAreaM2;
    const lamellaM = input.lamellaM ?? draft.takeoff.lamellaM;
    const tapeM2 = input.tapeM2 ?? draft.takeoff.tapeM2;

    const items =
      input.items ??
      (wallAreaM2 && lamellaM && tapeM2
        ? standardCfrpPackage({ wallAreaM2, lamellaM, tapeM2 })
        : draft.works
            .filter((work) => typeof work.quantity === "number" && work.quantity > 0)
            .map((work) => ({
              workCode: work.workCode,
              quantity: work.quantity as number,
              note: work.note,
            })));

    if (!items || items.length === 0) {
      return {
        ok: false as const,
        error:
          "Нужны объёмы: wallAreaM2 + lamellaM + tapeM2 (пакет как в КП SDT) либо явный список работ.",
        missing: listMissingFields(draft),
      };
    }

    const estimate = calculateEstimate({
      items,
      vatMode: input.vatMode ?? draft.commercial.vatMode ?? "added",
    });

    proposalDraft.update((current) =>
      mergeDraft(current, {
        takeoff: { wallAreaM2, lamellaM, tapeM2 },
        works: items,
        replaceWorks: true,
        commercial: { vatMode: estimate.vatMode },
        lastEstimate: estimate,
      }),
    );

    return { ok: true as const, estimate };
  },
});
