import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  ACCESS_LEVELS,
  HEIGHT_BANDS,
  OBJECT_TYPES,
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
  type DraftWorkItem,
} from "../lib/draft";

const optionalString = z.string().min(1).optional();

export default defineTool({
  description:
    "Save or merge commercial-proposal fields gathered from the user (client, object, works, site conditions, payment). Call after each batch of answers. Does not calculate money.",
  inputSchema: z.object({
    client: z
      .object({
        company: optionalString,
        contactName: optionalString,
        role: optionalString,
        phone: optionalString,
        email: optionalString,
        inn: optionalString,
      })
      .optional(),
    object: z
      .object({
        address: optionalString,
        type: z.enum(OBJECT_TYPES).optional(),
        construction: optionalString,
        yearBuilt: optionalString,
        description: optionalString,
      })
      .optional(),
    works: z
      .array(
        z.object({
          serviceCode: z.enum(SERVICE_CODES),
          quantity: z.number().positive().optional(),
          note: optionalString,
          unitPriceOverrideRub: z.number().nonnegative().optional(),
        }),
      )
      .optional(),
    replaceWorks: z
      .boolean()
      .optional()
      .describe("If true, replace the works list instead of merging by serviceCode."),
    conditions: z
      .object({
        heightBand: z.enum(HEIGHT_BANDS).optional(),
        water: z.enum(WATER_CONDITIONS).optional(),
        access: z.enum(ACCESS_LEVELS).optional(),
        season: z.enum(SEASONS).optional(),
        urgency: z.enum(URGENCY_LEVELS).optional(),
        canStopOperation: z.boolean().optional(),
        deadline: optionalString,
        distanceKm: z.number().nonnegative().optional(),
      })
      .optional(),
    commercial: z
      .object({
        vatMode: z.enum(VAT_MODES).optional(),
        paymentTerms: optionalString,
        validityDays: z.number().int().positive().max(90).optional(),
        discountPercent: z.number().min(0).max(25).optional(),
      })
      .optional(),
    notes: optionalString,
  }),
  async execute(input) {
    const distanceKm = input.conditions?.distanceKm;
    proposalDraft.update((current) => {
      const next = mergeDraft(current, {
        client: input.client,
        object: input.object,
        works: input.works as DraftWorkItem[] | undefined,
        replaceWorks: input.replaceWorks,
        conditions: input.conditions,
        commercial: input.commercial,
        notes: input.notes,
      });

      if (distanceKm !== undefined && distanceKm > 40) {
        const extraKm = Math.round(distanceKm - 40);
        const mobilization: DraftWorkItem = {
          serviceCode: "mobilization",
          quantity: extraKm,
          note: `Плечо ${distanceKm} км, сверх 40 км — ${extraKm} км`,
        };
        next.works = mergeDraft(next, {
          works: [mobilization],
        }).works;
      }

      if (
        !next.works.some((work) => work.serviceCode === "survey") &&
        (next.object.address || next.object.description)
      ) {
        next.works = mergeDraft(next, {
          works: [
            {
              serviceCode: "survey",
              quantity: 1,
              note: "Выезд инженера",
            },
          ],
        }).works;
      }

      return next;
    });

    const draft = proposalDraft.get();
    return {
      draft,
      missing: listMissingFields(draft),
    };
  },
});
