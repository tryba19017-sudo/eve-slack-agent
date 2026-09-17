import { company, DEFAULT_NOTES, DEFAULT_VALIDITY_MONTHS } from "./company";
import type { ProposalDraft } from "./draft-model";
import type { EstimateResult } from "./estimate";

function money(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function qty(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function makeOutgoingRef(now = new Date()): string {
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${d}-${m}/1`;
}

export function formatProposal(input: {
  draft: ProposalDraft;
  estimate: EstimateResult;
  outgoingRef?: string;
  issuedAt?: string;
}): { outgoingRef: string; markdown: string; slackText: string } {
  const issued = input.issuedAt ?? new Date().toISOString().slice(0, 10);
  const outgoingRef =
    input.outgoingRef ??
    input.draft.client.outgoingRef ??
    makeOutgoingRef();
  const { draft, estimate } = input;
  const objectName =
    draft.object.name ??
    draft.object.constructions ??
    "объект не указан";
  const client = draft.client.company ?? draft.client.contactName ?? "заказчик не указан";

  const blocks = estimate.lines.map((line, index) => {
    const materialRows = line.materials
      .map((mat) => {
        const note = mat.note ? ` (${mat.note})` : "";
        return `    • ${mat.name}${note}: ${qty(mat.quantity)} ${mat.unit} × ${money(mat.unitPriceRub)} = ${money(mat.amountRub)} ₽`;
      })
      .join("\n");
    const head = `${index + 1}. ${line.name} — ${qty(line.quantity)} ${line.unit}`;
    const labor = `    Работа: ${money(line.laborUnitRub)} + НР ${Math.round(estimate.overheadRate * 100)}% ${money(line.overheadUnitRub)} = ${money(line.laborUnitWithOverheadRub)} ₽/${line.unit} → ${money(line.laborAmountRub)} ₽`;
    const matTotal = `    Материалы: ${money(line.materialsAmountRub)} ₽`;
    const total = `    Итого позиция: ${money(line.totalRub)} ₽`;
    return [head, labor, materialRows, matTotal, total].filter(Boolean).join("\n");
  });

  const notes: string[] = [...DEFAULT_NOTES];
  if (draft.notes) notes.push(draft.notes);

  const markdown = [
    `*${company.name}*`,
    `Исх. ${outgoingRef} от ${issued}`,
    `Заказчик: ${client}`,
    `Объект: ${objectName}`,
    draft.object.address ? `Адрес: ${draft.object.address}` : undefined,
    "",
    "*Расчёт стоимости работ и материалов*",
    "",
    ...blocks,
    "",
    `Итого материалы: ${money(estimate.materialsAmountRub)} ₽`,
    `Итого работы с накладными ${Math.round(estimate.overheadRate * 100)}%: ${money(estimate.laborAmountRub)} ₽`,
    `*Итого по расчёту без НДС: ${money(estimate.netRub)} ₽*`,
    `НДС ${Math.round(estimate.vatRate * 100)}%: ${money(estimate.vatRub)} ₽`,
    `*Всего с НДС ${Math.round(estimate.vatRate * 100)}%: ${money(estimate.totalRub)} ₽*`,
    "",
    "*Примечания:*",
    ...notes.map((line, i) => `${i + 1}. ${line}`),
    "",
    `Руководитель ${company.name} _____________ ${company.director}`,
    `тел. ${company.phone}`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  return {
    outgoingRef,
    markdown,
    slackText: markdown.replaceAll("*", ""),
  };
}

export function validityCaption(draft: ProposalDraft): string {
  const months = draft.commercial.validityMonths ?? DEFAULT_VALIDITY_MONTHS;
  return `действительно ${months} мес.`;
}
