import { defineTool } from "eve/tools";
import { z } from "zod";
import { WORK_CODES } from "../lib/catalog";
import {
  listMissingFields,
  mergeDraft,
  proposalDraft,
  type DraftWorkItem,
} from "../lib/draft";

const optionalString = z.string().min(1).optional();
const pieceSchema = z.object({
  name: optionalString,
  lengthMm: z.number().positive(),
  widthMm: z.number().positive(),
  quantity: z.number().int().positive(),
  layers: z.number().int().positive().optional(),
});

export default defineTool({
  description:
    "Save or merge commercial-proposal fields: client, object, wall area / lamella meters / tape m², or explicit work quantities. Does not calculate money.",
  inputSchema: z.object({
    client: z
      .object({
        company: optionalString,
        contactName: optionalString,
        outgoingRef: optionalString,
      })
      .optional(),
    object: z
      .object({
        name: optionalString,
        address: optionalString,
        constructions: optionalString,
      })
      .optional(),
    takeoff: z
      .object({
        wallAreaM2: z.number().positive().optional(),
        lamellaM: z.number().positive().optional(),
        tapeM2: z.number().positive().optional(),
        lamellas: z.array(pieceSchema).optional(),
        tapes: z.array(pieceSchema).optional(),
      })
      .optional(),
    works: z
      .array(
        z.object({
          workCode: z.enum(WORK_CODES),
          quantity: z.number().positive().optional(),
          note: optionalString,
        }),
      )
      .optional(),
    replaceWorks: z.boolean().optional(),
    commercial: z
      .object({
        vatMode: z.enum(["none", "added"]).optional(),
        paymentTerms: optionalString,
        validityMonths: z.number().int().positive().max(6).optional(),
        designWeeks: z.number().int().positive().max(24).optional(),
        workWeeks: z.number().int().positive().max(24).optional(),
      })
      .optional(),
    notes: optionalString,
  }),
  async execute(input) {
    proposalDraft.update((current) =>
      mergeDraft(current, {
        client: input.client,
        object: input.object,
        takeoff: input.takeoff,
        works: input.works as DraftWorkItem[] | undefined,
        replaceWorks: input.replaceWorks,
        commercial: input.commercial,
        notes: input.notes,
      }),
    );
    const draft = proposalDraft.get();
    return { draft, missing: listMissingFields(draft) };
  },
});
