import type {
  AccessLevel,
  HeightBand,
  ObjectType,
  Season,
  Urgency,
  VatMode,
  WaterCondition,
} from "./catalog";
import { DEFAULT_VALIDITY_DAYS } from "./company";
import type { EstimateResult } from "./estimate";

export type DraftWorkItem = {
  serviceCode: string;
  quantity?: number;
  note?: string;
  unitPriceOverrideRub?: number;
};

export type ProposalDraft = {
  client: {
    company?: string;
    contactName?: string;
    role?: string;
    phone?: string;
    email?: string;
    inn?: string;
  };
  object: {
    address?: string;
    type?: ObjectType;
    construction?: string;
    yearBuilt?: string;
    description?: string;
  };
  works: DraftWorkItem[];
  conditions: {
    heightBand?: HeightBand;
    water?: WaterCondition;
    access?: AccessLevel;
    season?: Season;
    urgency?: Urgency;
    canStopOperation?: boolean;
    deadline?: string;
    distanceKm?: number;
  };
  commercial: {
    vatMode?: VatMode;
    paymentTerms?: string;
    validityDays?: number;
    discountPercent?: number;
  };
  notes?: string;
  lastEstimate?: EstimateResult;
};

export const emptyDraft = (): ProposalDraft => ({
  client: {},
  object: {},
  works: [],
  conditions: {},
  commercial: {
    vatMode: "added",
    paymentTerms: "50% аванс, 50% по акту выполненных работ",
    validityDays: DEFAULT_VALIDITY_DAYS,
    discountPercent: 0,
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
      question: "Как называется компания-заказчик или как зовут контактное лицо?",
      required: true,
    });
  }
  if (!draft.object.address && !draft.object.description) {
    missing.push({
      path: "object.address",
      question: "Где объект: адрес или хотя бы район и тип здания?",
      required: true,
    });
  }
  if (!draft.object.type) {
    missing.push({
      path: "object.type",
      question:
        "Какой тип объекта: ЖК, бизнес-центр, паркинг, промка, мост, подземка?",
      required: false,
    });
  }
  if (!draft.object.construction) {
    missing.push({
      path: "object.construction",
      question:
        "Что ремонтируем: стена, плита, шов, фундамент, колонна, стилобат?",
      required: false,
    });
  }
  const hasQuantity = draft.works.some(
    (work) =>
      work.serviceCode !== "survey" &&
      work.serviceCode !== "mobilization" &&
      typeof work.quantity === "number" &&
      work.quantity > 0,
  );
  if (draft.works.length === 0 || !hasQuantity) {
    missing.push({
      path: "works",
      question:
        "Какой объём работ? Для трещин — погонные метры, для гидроизоляции — м², для датчиков — штуки.",
      required: true,
    });
  }
  if (!draft.conditions.water) {
    missing.push({
      path: "conditions.water",
      question: "Есть ли вода в трещине: сухо, влажно или активная течь?",
      required: false,
    });
  }
  if (!draft.conditions.heightBand) {
    missing.push({
      path: "conditions.heightBand",
      question: "На какой высоте работы: до 5 м, 5–15, 15–30 или выше 30 м?",
      required: false,
    });
  }
  if (!draft.conditions.access) {
    missing.push({
      path: "conditions.access",
      question:
        "Какой доступ: свободный, ограниченный без остановки объекта, или тесное пространство / ночное окно?",
      required: false,
    });
  }
  if (!draft.conditions.deadline) {
    missing.push({
      path: "conditions.deadline",
      question: "К какому сроку нужно выполнить работы?",
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
    works?: DraftWorkItem[];
    replaceWorks?: boolean;
    conditions?: ProposalDraft["conditions"];
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
    works,
    conditions: mergeDefined(current.conditions, patch.conditions),
    commercial: mergeDefined(current.commercial, patch.commercial),
    notes: patch.notes ?? current.notes,
    lastEstimate: patch.lastEstimate ?? current.lastEstimate,
  };
}

function mergeWorks(
  current: DraftWorkItem[],
  incoming: DraftWorkItem[],
): DraftWorkItem[] {
  const byCode = new Map(current.map((item) => [item.serviceCode, { ...item }]));
  for (const item of incoming) {
    const existing = byCode.get(item.serviceCode);
    byCode.set(item.serviceCode, existing ? { ...existing, ...item } : item);
  }
  return [...byCode.values()];
}
