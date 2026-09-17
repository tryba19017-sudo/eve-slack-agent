import { defineTool } from "eve/tools";
import { z } from "zod";
import { listMissingFields, mergeDraft, proposalDraft } from "../lib/draft";
import { formatProposal, makeOutgoingRef } from "../lib/proposal";

export default defineTool({
  description:
    "Format the saved draft and last estimate as an SDT commercial proposal (исх. номер, таблица работ/материалов, НДС 22%, типовые примечания). Call only after calculate_estimate. Return markdown as-is; do not invent totals.",
  inputSchema: z.object({
    outgoingRef: z.string().min(3).optional(),
    issuedAt: z.string().min(8).optional(),
  }),
  async execute({ outgoingRef, issuedAt }) {
    const draft = proposalDraft.get();
    if (!draft.lastEstimate) {
      return {
        ok: false as const,
        error: "Сначала посчитайте смету через calculate_estimate.",
        missing: listMissingFields(draft),
      };
    }

    const formatted = formatProposal({
      draft,
      estimate: draft.lastEstimate,
      outgoingRef: outgoingRef ?? draft.client.outgoingRef ?? makeOutgoingRef(),
      issuedAt,
    });

    proposalDraft.update((current) =>
      mergeDraft(current, { client: { outgoingRef: formatted.outgoingRef } }),
    );

    return {
      ok: true as const,
      ...formatted,
      totalRub: draft.lastEstimate.totalRub,
      netRub: draft.lastEstimate.netRub,
      vatRub: draft.lastEstimate.vatRub,
      missingRequired: listMissingFields(draft).filter((field) => field.required),
      disclaimer:
        "Предварительный расчёт. Количество материалов корректируется после осмотра и проекта.",
    };
  },
});
