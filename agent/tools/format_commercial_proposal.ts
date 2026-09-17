import { defineTool } from "eve/tools";
import { z } from "zod";
import { listMissingFields, proposalDraft } from "../lib/draft";
import { formatProposal, makeProposalNumber } from "../lib/proposal";

export default defineTool({
  description:
    "Format the saved draft and last estimate into a ready-to-send Russian commercial proposal (КП). Call only after calculate_estimate. Return markdown to the user; do not invent totals.",
  inputSchema: z.object({
    proposalNumber: z.string().min(3).optional(),
  }),
  async execute({ proposalNumber }) {
    const draft = proposalDraft.get();
    if (!draft.lastEstimate) {
      return {
        ok: false as const,
        error:
          "Сначала посчитайте смету инструментом calculate_estimate — без неё нельзя выписать КП.",
        missing: listMissingFields(draft),
      };
    }

    const required = listMissingFields(draft).filter((field) => field.required);
    const formatted = formatProposal({
      draft,
      estimate: draft.lastEstimate,
      proposalNumber: proposalNumber ?? makeProposalNumber(),
    });

    return {
      ok: true as const,
      ...formatted,
      totalRub: draft.lastEstimate.totalRub,
      belowMinimum: draft.lastEstimate.belowMinimum,
      missingOptional: listMissingFields(draft).filter((field) => !field.required),
      missingRequired: required,
      disclaimer:
        "Это предварительное КП. Твёрдая цена — после выезда инженера и обмеров.",
    };
  },
});
