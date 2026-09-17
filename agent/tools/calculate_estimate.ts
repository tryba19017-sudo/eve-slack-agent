import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  ACCESS_LEVELS,
  HEIGHT_BANDS,
  SEASONS,
  SERVICE_CODES,
  URGENCY_LEVELS,
  VAT_MODES,
  WATER_CONDITIONS,
} from "../lib/catalog";
import {
  listMissingFields,
  mergeDraft,
  proposalDraft,
} from "../lib/draft";
import { calculateEstimate } from "../lib/estimate";

const workItemSchema = z.object({
  serviceCode: z.enum(SERVICE_CODES),
  quantity: z.number().positive(),
  note: z.string().optional(),
  unitPriceOverrideRub: z.number().nonnegative().optional(),
});

export default defineTool({
  description:
    "Calculate a Panda Core estimate from catalog rates, quantities, and site coefficients. Persists the result on the session draft. Prefer items from the draft if the user already saved works.",
  inputSchema: z.object({
    items: z.array(workItemSchema).optional(),
    heightBand: z.enum(HEIGHT_BANDS).optional(),
    water: z.enum(WATER_CONDITIONS).optional(),
    access: z.enum(ACCESS_LEVELS).optional(),
    season: z.enum(SEASONS).optional(),
    urgency: z.enum(URGENCY_LEVELS).optional(),
    vatMode: z.enum(VAT_MODES).optional(),
    discountPercent: z.number().min(0).max(25).optional(),
  }),
  async execute(input) {
    const draft = proposalDraft.get();
    const items =
      input.items ??
      draft.works
        .filter((work) => typeof work.quantity === "number" && work.quantity > 0)
        .map((work) => ({
          serviceCode: work.serviceCode,
          quantity: work.quantity as number,
          note: work.note,
          unitPriceOverrideRub: work.unitPriceOverrideRub,
        }));

    if (items.length === 0) {
      return {
        ok: false as const,
        error:
          "Нет позиций с количеством. Сначала сохраните объёмы через save_proposal_draft или передайте items.",
        missing: listMissingFields(draft),
      };
    }

    const estimate = calculateEstimate({
      items,
      coefficients: {
        heightBand: input.heightBand ?? draft.conditions.heightBand ?? "0-5",
        water: input.water ?? draft.conditions.water ?? "dry",
        access: input.access ?? draft.conditions.access ?? "easy",
        season: input.season ?? draft.conditions.season ?? "above_5c",
        urgency: input.urgency ?? draft.conditions.urgency ?? "normal",
      },
      vatMode: input.vatMode ?? draft.commercial.vatMode ?? "added",
      discountPercent:
        input.discountPercent ?? draft.commercial.discountPercent ?? 0,
    });

    proposalDraft.update((current) =>
      mergeDraft(current, {
        works: items,
        replaceWorks: true,
        conditions: {
          heightBand: estimate.coefficients.heightBand,
          water: estimate.coefficients.water,
          access: estimate.coefficients.access,
          season: estimate.coefficients.season,
          urgency: estimate.coefficients.urgency,
        },
        commercial: {
          vatMode: estimate.vatMode,
          discountPercent: estimate.discountPercent,
        },
        lastEstimate: estimate,
      }),
    );

    return { ok: true as const, estimate };
  },
});
