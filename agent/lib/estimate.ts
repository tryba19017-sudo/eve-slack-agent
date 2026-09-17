import { MINIMUM_ORDER_RUB, VAT_RATE } from "./company";
import {
  ACCESS_COEFFICIENT,
  type AccessLevel,
  getCatalogItem,
  HEIGHT_COEFFICIENT,
  type HeightBand,
  SEASON_COEFFICIENT,
  type Season,
  URGENCY_COEFFICIENT,
  type Urgency,
  VAT_MODES,
  type VatMode,
  WATER_COEFFICIENT,
  type WaterCondition,
} from "./catalog";

export type EstimateLineInput = {
  serviceCode: string;
  quantity: number;
  note?: string;
  unitPriceOverrideRub?: number;
};

export type EstimateCoefficients = {
  heightBand: HeightBand;
  water: WaterCondition;
  access: AccessLevel;
  season: Season;
  urgency: Urgency;
};

export type EstimateLine = {
  serviceCode: string;
  name: string;
  unit: string;
  quantity: number;
  unitPriceRub: number;
  coefficientsApplied: number;
  amountRub: number;
  note?: string;
};

export type EstimateResult = {
  lines: EstimateLine[];
  coefficients: EstimateCoefficients;
  coefficientProduct: number;
  coefficientBreakdown: Record<string, { k: number; label: string }>;
  worksSubtotalRub: number;
  discountPercent: number;
  discountRub: number;
  netRub: number;
  vatMode: VatMode;
  vatRate: number;
  vatRub: number;
  totalRub: number;
  minimumOrderRub: number;
  belowMinimum: boolean;
  assumptions: string[];
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function coefficientProduct(c: EstimateCoefficients): number {
  return (
    HEIGHT_COEFFICIENT[c.heightBand].k *
    WATER_COEFFICIENT[c.water].k *
    ACCESS_COEFFICIENT[c.access].k *
    SEASON_COEFFICIENT[c.season].k *
    URGENCY_COEFFICIENT[c.urgency].k
  );
}

export function calculateEstimate(input: {
  items: EstimateLineInput[];
  coefficients: EstimateCoefficients;
  vatMode?: VatMode;
  discountPercent?: number;
}): EstimateResult {
  if (input.items.length === 0) {
    throw new Error("Нужна хотя бы одна позиция с количеством.");
  }

  const vatMode = input.vatMode ?? "added";
  if (!VAT_MODES.includes(vatMode)) {
    throw new Error(`Неизвестный режим НДС: ${String(input.vatMode)}`);
  }

  const discountPercent = input.discountPercent ?? 0;
  if (discountPercent < 0 || discountPercent > 25) {
    throw new Error("Скидка допустима в диапазоне 0–25%.");
  }

  const product = coefficientProduct(input.coefficients);
  const lines: EstimateLine[] = [];

  for (const item of input.items) {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new Error(
        `Количество для «${item.serviceCode}» должно быть больше нуля.`,
      );
    }
    const catalog = getCatalogItem(item.serviceCode);
    const unitPrice =
      item.unitPriceOverrideRub !== undefined
        ? item.unitPriceOverrideRub
        : catalog.unitPriceRub;
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error(`Некорректная цена для «${item.serviceCode}».`);
    }
    const k = catalog.applyCoefficients ? product : 1;
    const amountRub = roundMoney(item.quantity * unitPrice * k);
    lines.push({
      serviceCode: catalog.code,
      name: catalog.name,
      unit: catalog.unit,
      quantity: item.quantity,
      unitPriceRub: unitPrice,
      coefficientsApplied: roundMoney(k),
      amountRub,
      note: item.note,
    });
  }

  const worksSubtotalRub = roundMoney(
    lines.reduce((sum, line) => sum + line.amountRub, 0),
  );
  const discountRub = roundMoney((worksSubtotalRub * discountPercent) / 100);
  const netRub = roundMoney(worksSubtotalRub - discountRub);

  let vatRub = 0;
  let totalRub = netRub;
  if (vatMode === "added") {
    vatRub = roundMoney(netRub * VAT_RATE);
    totalRub = roundMoney(netRub + vatRub);
  } else if (vatMode === "included") {
    vatRub = roundMoney((netRub * VAT_RATE) / (1 + VAT_RATE));
    totalRub = netRub;
  }

  const assumptions = [
    "Расценка ориентировочная: финальная смета после выезда инженера и обмера.",
    "В стоимость входят материалы, пакеры, оборудование и работа бригады, если не указано иное.",
    "Гарантия до 10 лет — при выполнении полного цикла по регламенту Panda Core.",
    "Минимальная стоимость выезда бригады — 80 000 ₽ без учёта мобилизации.",
  ];

  return {
    lines,
    coefficients: input.coefficients,
    coefficientProduct: roundMoney(product),
    coefficientBreakdown: {
      height: HEIGHT_COEFFICIENT[input.coefficients.heightBand],
      water: WATER_COEFFICIENT[input.coefficients.water],
      access: ACCESS_COEFFICIENT[input.coefficients.access],
      season: SEASON_COEFFICIENT[input.coefficients.season],
      urgency: URGENCY_COEFFICIENT[input.coefficients.urgency],
    },
    worksSubtotalRub,
    discountPercent,
    discountRub,
    netRub,
    vatMode,
    vatRate: VAT_RATE,
    vatRub,
    totalRub,
    minimumOrderRub: MINIMUM_ORDER_RUB,
    belowMinimum: totalRub > 0 && totalRub < MINIMUM_ORDER_RUB,
    assumptions,
  };
}
