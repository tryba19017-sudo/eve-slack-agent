import { calculateEstimate, standardCfrpPackage } from "./estimate";
import { formatProposal } from "./proposal";
import { emptyDraft, listMissingFields, mergeDraft } from "./draft-model";
import { takeoffFromPieces } from "./takeoff";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertClose(actual: number, expected: number, label: string, eps = 0.02) {
  if (Math.abs(actual - expected) > eps) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

const sdtSample = calculateEstimate({
  items: standardCfrpPackage({
    wallAreaM2: 21.5,
    lamellaM: 86.77,
    tapeM2: 6.99,
  }),
});

assertEqual(sdtSample.lines[0]?.laborAmountRub, 73564.4, "prep labor");
assertEqual(sdtSample.lines[1]?.laborAmountRub, 146581.2, "repair labor");
assertClose(sdtSample.lines[2]?.laborAmountRub ?? 0, 221902.99, "lamella labor");
assertClose(sdtSample.lines[3]?.laborAmountRub ?? 0, 17876.02, "tape labor");
assertEqual(sdtSample.lines[4]?.laborAmountRub, 62887.5, "fire labor");

const repairMats = sdtSample.lines[1]?.materials ?? [];
assertEqual(repairMats[0]?.quantity, 43, "mapegrout 2 kg/m2");
assertEqual(repairMats[0]?.amountRub, 2748.99, "mapegrout amount");
assertEqual(repairMats[1]?.quantity, 21.5, "manopox 1 kg/m2");
assertEqual(repairMats[1]?.amountRub, 24196.32, "manopox amount");

const lamellaMats = sdtSample.lines[2]?.materials ?? [];
assertEqual(lamellaMats[0]?.quantity, 95.45, "lamella +10%");
assertEqual(lamellaMats[1]?.quantity, 143.17, "laminate resin 1.65 kg/m");
assertClose(lamellaMats[1]?.amountRub ?? 0, 412365.39, "laminate resin amount");

const fireMats = sdtSample.lines[4]?.materials ?? [];
assertEqual(fireMats[0]?.quantity, 53.75, "iceberg 2.5 kg/m2");
assertEqual(fireMats[0]?.amountRub, 45819.73, "iceberg amount");

assertEqual(sdtSample.vatRate, 0.22, "VAT 22%");
assertClose(sdtSample.vatRub, sdtSample.netRub * 0.22, "VAT amount");
assertClose(sdtSample.totalRub, sdtSample.netRub + sdtSample.vatRub, "gross");

const bom = takeoffFromPieces({
  lamellas: [
    { lengthMm: 4005, widthMm: 150, quantity: 10 },
    { lengthMm: 5000, widthMm: 150, quantity: 2 },
    { lengthMm: 4750, widthMm: 150, quantity: 2 },
    { lengthMm: 4750, widthMm: 150, quantity: 2 },
    { lengthMm: 2215, widthMm: 150, quantity: 8 },
  ],
  tapes: [
    { lengthMm: 4850, widthMm: 200, quantity: 5 },
    { lengthMm: 2935, widthMm: 200, quantity: 1 },
  ],
});
assertClose(bom.lamellaM, 86.77, "sketch lamella sum");
assertClose(bom.tapeLengthM, 27.185, "sketch tape length");
assertClose(bom.tapeM2FromStrips, 5.437, "tape L×b, one layer");

const draft = mergeDraft(emptyDraft(), {
  client: { company: "МБ-Проект Бюро" },
  object: { name: "Усиление стен С4 и С5 в уровне +1-го этажа" },
  takeoff: { wallAreaM2: 21.5, lamellaM: 86.77, tapeM2: 6.99 },
});
assertEqual(listMissingFields(draft).filter((f) => f.required).length, 0, "required filled");

const formatted = formatProposal({
  draft,
  estimate: sdtSample,
  outgoingRef: "01-09/1",
  issuedAt: "01.09.2026",
});
if (!formatted.markdown.includes("МБ-Проект Бюро")) {
  throw new Error("client missing from КП");
}
if (!formatted.markdown.includes("НДС 22%")) {
  throw new Error("VAT line missing");
}

console.log(
  `SDT sample: net ${sdtSample.netRub} VAT ${sdtSample.vatRub} total ${sdtSample.totalRub}`,
);
console.log("estimate checks passed");
