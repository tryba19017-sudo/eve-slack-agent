import { defineState } from "eve/context";
import { emptyDraft } from "./draft-model";

export {
  emptyDraft,
  listMissingFields,
  mergeDraft,
  type DraftWorkItem,
  type MissingField,
  type ProposalDraft,
} from "./draft-model";

export const proposalDraft = defineState(
  "panda-core.proposal-draft",
  emptyDraft,
);
