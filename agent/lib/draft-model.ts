import type { WorkCode } from "./catalog";
import {
  DEFAULT_PAYMENT_TERMS,
  DEFAULT_VALIDITY_MONTHS,
} from "./company";
import type { EstimateResult } from "./estimate";
import type { StripPiece } from "./takeoff";

export type DraftWorkItem = {
  workCode: WorkCode | string;
  quantity?: number;
  note?: string;
};

export type ProposalDraft = {
  client: {
    company?: string;
    contactName?: string;
    outgoingRef?: string;
  };
  object: {
    name?: string;
    address?: string;
    constructions?: string;
  };
  takeoff: {
    wallAreaM2?: number;
    lamellaM?: number;
    tapeM2?: number;
    lamellas?: StripPiece[];
    tapes?: StripPiece[];
  };
  works: DraftWorkItem[];
  commercial: {
    vatMode?: "none" | "added";
    paymentTerms?: string;
    validityMonths?: number;
    designWeeks?: number;
    workWeeks?: number;
  };
  notes?: string;
  lastEstimate?: EstimateResult;
};

export const emptyDraft = (): ProposalDraft => ({
  client: {},
  object: {},
  takeoff: {},
  works: [],
  commercial: {
    vatMode: "added",
    paymentTerms: DEFAULT_PAYMENT_TERMS,
    validityMonths: DEFAULT_VALIDITY_MONTHS,
    designWeeks: 4,
    workWeeks: 4,
  },
});

export type MissingField = {
  path: string;
  question: string;
  required: boolean;
};

export function listMissingFields(draft: ProposalDraft): MissingField[] {
  const missing: MissingField[] = [];
  if (!draft.client.company && !draft.client.contactName) {
    missing.push({
      path: "client.company",
      question: "Кто заказчик (организация)?",
      required: true,
    });
  }
  if (!draft.object.name && !draft.object.constructions) {
    missing.push({
      path: "object.name",
      question:
        "Что усиливаем? Например: стены С4 и С5 в уровне +1-го этажа.",
      required: true,
    });
  }
  const hasWorks = draft.works.some(
    (work) => typeof work.quantity === "number" && work.quantity > 0,
  );
  const hasTakeoff =
    (draft.takeoff.wallAreaM2 ?? 0) > 0 ||
    (draft.takeoff.lamellaM ?? 0) > 0 ||
    (draft.takeoff.tapeM2 ?? 0) > 0;
  if (!hasWorks && !hasTakeoff) {
    missing.push({
      path: "takeoff",
      question:
        "Какие объёмы: площадь усиления (м²), погонаж ламелей (м) и площадь холста/хомутов (м²)? Можно таблицей с L, b и количеством.",
      required: true,
    });
  }
  if (draft.takeoff.wallAreaM2 === undefined && !hasWorks) {
    missing.push({
      path: "takeoff.wallAreaM2",
      question:
        "Площадь подготовки/ремонта/огнезащиты, м² (в образце — 21,50 м² стен С4 и С5).",
      required: false,
    });
  }
  return missing;
}

function mergeDefined<T extends Record<string, unknown>>(
  current: T,
  patch: Partial<T> | undefined,
): T {
  if (!patch) return current;
  const next = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) {
      (next as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}

export function mergeDraft(
  current: ProposalDraft,
  patch: {
    client?: ProposalDraft["client"];
    object?: ProposalDraft["object"];
    takeoff?: ProposalDraft["takeoff"];
    works?: DraftWorkItem[];
    replaceWorks?: boolean;
    commercial?: ProposalDraft["commercial"];
    notes?: string;
    lastEstimate?: EstimateResult;
  },
): ProposalDraft {
  let works = current.works;
  if (patch.works) {
    works = patch.replaceWorks
      ? patch.works
      : mergeWorks(current.works, patch.works);
  }

  return {
    client: mergeDefined(current.client, patch.client),
    object: mergeDefined(current.object, patch.object),
    takeoff: mergeDefined(current.takeoff, patch.takeoff),
    works,
    commercial: mergeDefined(current.commercial, patch.commercial),
    notes: patch.notes ?? current.notes,
    lastEstimate: patch.lastEstimate ?? current.lastEstimate,
  };
}

function mergeWorks(
  current: DraftWorkItem[],
  incoming: DraftWorkItem[],
): DraftWorkItem[] {
  const byCode = new Map(current.map((item) => [item.workCode, { ...item }]));
  for (const item of incoming) {
    const existing = byCode.get(item.workCode);
    byCode.set(item.workCode, existing ? { ...existing, ...item } : item);
  }
  return [...byCode.values()];
}
