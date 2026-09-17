import { getMaterial, getWork, type VatMode, type WorkCode } from "./catalog";
import { LABOR_OVERHEAD_RATE, VAT_RATE } from "./company";

export type WorkLineInput = {
  workCode: WorkCode | string;
  quantity: number;
  note?: string;
};

export type MaterialLine = {
  materialCode: string;
  name: string;
  unit: string;
  quantity: number;
  unitPriceRub: number;
  amountRub: number;
  note?: string;
};

export type WorkLine = {
  workCode: string;
  name: string;
  unit: string;
  quantity: number;
  laborUnitRub: number;
  overheadUnitRub: number;
  laborUnitWithOverheadRub: number;
  laborAmountRub: number;
  materials: MaterialLine[];
  materialsAmountRub: number;
  totalRub: number;
  note?: string;
};

export type EstimateResult = {
  lines: WorkLine[];
  materialsAmountRub: number;
  laborAmountRub: number;
  netRub: number;
  vatMode: VatMode;
  vatRate: number;
  vatRub: number;
  totalRub: number;
  overheadRate: number;
};

export function roundMoney(value: number): number {
  return Math.round(value * 100 + 1e-8) / 100;
}

/** Multiply two 2-decimal money/qty values without binary drift. */
export function moneyMul(a: number, b: number): number {
  const aCents = Math.round(a * 100 + 1e-8);
  const bCents = Math.round(b * 100 + 1e-8);
  return Math.round((aCents * bCents) / 100) / 100;
}

export function calculateEstimate(input: {
  items: WorkLineInput[];
  vatMode?: VatMode;
}): EstimateResult {
  if (input.items.length === 0) {
    throw new Error("Нужна хотя бы одна позиция работ с количеством.");
  }

  const vatMode: VatMode = input.vatMode ?? "added";
  const lines: WorkLine[] = input.items.map((item) => {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new Error(`Количество для «${item.workCode}» должно быть больше нуля.`);
    }
    const work = getWork(item.workCode);
    const overheadUnitRub = roundMoney(work.laborUnitRub * LABOR_OVERHEAD_RATE);
    const laborUnitWithOverheadRub = roundMoney(work.laborUnitRub + overheadUnitRub);
    const laborAmountRub = moneyMul(item.quantity, laborUnitWithOverheadRub);

    const materials: MaterialLine[] = work.materials.map((norm) => {
      const material = getMaterial(norm.materialCode);
      const quantity = roundMoney(
        item.quantity * norm.perWorkUnit * (1 + norm.wasteRate),
      );
      return {
        materialCode: material.code,
        name: material.name,
        unit: material.unit,
        quantity,
        unitPriceRub: material.unitPriceRub,
        amountRub: moneyMul(quantity, material.unitPriceRub),
        note: norm.note,
      };
    });

    const materialsAmountRub = roundMoney(
      materials.reduce((sum, line) => sum + line.amountRub, 0),
    );

    return {
      workCode: work.code,
      name: work.name,
      unit: work.unit,
      quantity: item.quantity,
      laborUnitRub: work.laborUnitRub,
      overheadUnitRub,
      laborUnitWithOverheadRub,
      laborAmountRub,
      materials,
      materialsAmountRub,
      totalRub: roundMoney(laborAmountRub + materialsAmountRub),
      note: item.note,
    };
  });

  const materialsAmountRub = roundMoney(
    lines.reduce((sum, line) => sum + line.materialsAmountRub, 0),
  );
  const laborAmountRub = roundMoney(
    lines.reduce((sum, line) => sum + line.laborAmountRub, 0),
  );
  const netRub = roundMoney(materialsAmountRub + laborAmountRub);
  const vatRub = vatMode === "added" ? roundMoney(netRub * VAT_RATE) : 0;
  const totalRub = roundMoney(netRub + vatRub);

  return {
    lines,
    materialsAmountRub,
    laborAmountRub,
    netRub,
    vatMode,
    vatRate: VAT_RATE,
    vatRub,
    totalRub,
    overheadRate: LABOR_OVERHEAD_RATE,
  };
}

/** Typical CFRP wall-strengthening package from the SDT template. */
export function standardCfrpPackage(input: {
  wallAreaM2: number;
  lamellaM: number;
  tapeM2: number;
}): WorkLineInput[] {
  return [
    { workCode: "surface_prep", quantity: input.wallAreaM2 },
    { workCode: "surface_repair", quantity: input.wallAreaM2 },
    { workCode: "lamella_install", quantity: input.lamellaM },
    { workCode: "tape_install", quantity: input.tapeM2 },
    { workCode: "fire_protection", quantity: input.wallAreaM2 },
  ];
}
