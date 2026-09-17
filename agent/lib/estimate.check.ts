import { calculateEstimate } from "./estimate";
import { formatProposal } from "./proposal";
import { emptyDraft, listMissingFields, mergeDraft } from "./draft-model";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assert(condition: unknown, label: string) {
  if (!condition) throw new Error(label);
}

const dryParking = calculateEstimate({
  items: [
    { serviceCode: "survey", quantity: 1 },
    { serviceCode: "crack_prep", quantity: 40 },
    { serviceCode: "polymer_injection_pu", quantity: 40 },
  ],
  coefficients: {
    heightBand: "0-5",
    water: "dry",
    access: "easy",
    season: "above_5c",
    urgency: "normal",
  },
  vatMode: "added",
});

assertEqual(dryParking.lines[0]?.amountRub, 0, "survey is free");
assertEqual(dryParking.lines[1]?.amountRub, 40 * 850, "prep without coefficients");
assertEqual(dryParking.lines[2]?.amountRub, 40 * 4900, "PU injection");
assertEqual(dryParking.netRub, 40 * 850 + 40 * 4900, "net");
assertEqual(dryParking.vatRub, Math.round(dryParking.netRub * 0.22 * 100) / 100, "VAT 22%");
assertEqual(dryParking.belowMinimum, false, "40 m is above minimum");

const leakHigh = calculateEstimate({
  items: [{ serviceCode: "polymer_injection_pu", quantity: 10 }],
  coefficients: {
    heightBand: "15-30",
    water: "active_leak",
    access: "restricted",
    season: "winter",
    urgency: "emergency",
  },
  vatMode: "none",
  discountPercent: 10,
});

const expectedK = 1.3 * 1.35 * 1.18 * 1.15 * 1.5;
assertEqual(leakHigh.coefficientProduct, Math.round(expectedK * 100) / 100, "k product");
assertEqual(
  leakHigh.lines[0]?.amountRub,
  Math.round(10 * 4900 * expectedK * 100) / 100,
  "leaky high-rise amount",
);
assert(leakHigh.discountRub > 0, "discount applied");
assertEqual(leakHigh.vatRub, 0, "no VAT");

const tiny = calculateEstimate({
  items: [{ serviceCode: "crack_monitoring", quantity: 1 }],
  coefficients: {
    heightBand: "0-5",
    water: "dry",
    access: "easy",
    season: "above_5c",
    urgency: "normal",
  },
});
assert(tiny.belowMinimum, "single sensor is below minimum");
assertEqual(tiny.lines[0]?.coefficientsApplied, 1, "monitoring ignores coefficients");

const draft = mergeDraft(emptyDraft(), {
  client: { company: "ООО Тест" },
  object: { address: "Москва, тестовый паркинг", type: "parking" },
  works: [{ serviceCode: "polymer_injection_pu", quantity: 12 }],
});
assertEqual(listMissingFields(draft).filter((f) => f.required).length, 0, "required filled");

const surveyOnly = mergeDraft(emptyDraft(), {
  client: { company: "ООО Тест" },
  object: { address: "Москва" },
  works: [{ serviceCode: "survey", quantity: 1 }],
});
assert(
  surveyOnly.works.length === 1 &&
    listMissingFields(surveyOnly).some((f) => f.path === "works" && f.required),
  "survey alone is not a measured scope",
);

const formatted = formatProposal({ draft, estimate: dryParking, proposalNumber: "КП-TEST" });
assert(formatted.markdown.includes("КП-TEST"), "proposal number in markdown");
assert(formatted.markdown.includes("Итого к оплате"), "total line");

console.log("estimate checks passed");
