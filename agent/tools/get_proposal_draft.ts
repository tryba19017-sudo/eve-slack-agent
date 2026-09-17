import { defineTool } from "eve/tools";
import { z } from "zod";
import { listMissingFields, proposalDraft } from "../lib/draft";

export default defineTool({
  description:
    "Read the current commercial-proposal draft and the list of missing fields. Use before asking the user follow-up questions.",
  inputSchema: z.object({}),
  async execute() {
    const draft = proposalDraft.get();
    return {
      draft,
      missing: listMissingFields(draft),
      hasEstimate: Boolean(draft.lastEstimate),
    };
  },
});
