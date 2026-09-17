import {
  ACCESS_COEFFICIENT,
  HEIGHT_COEFFICIENT,
  OBJECT_TYPE_LABEL,
  SEASON_COEFFICIENT,
  URGENCY_COEFFICIENT,
  WATER_COEFFICIENT,
} from "./catalog";
import { company, DEFAULT_VALIDITY_DAYS } from "./company";
import type { ProposalDraft } from "./draft-model";
import type { EstimateResult } from "./estimate";

function money(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function qty(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2,
  }).format(value);
}

function vatLabel(mode: EstimateResult["vatMode"], rate: number): string {
  const pct = Math.round(rate * 100);
  if (mode === "none") return "НДС не облагается";
  if (mode === "included") return `в т.ч. НДС ${pct}%`;
  return `НДС ${pct}% сверху`;
}

export function makeProposalNumber(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const seq = String(now.getHours() * 60 + now.getMinutes()).padStart(4, "0");
  return `КП-${y}${m}${d}-${seq}`;
}

function clientLine(draft: ProposalDraft): string {
  const parts = [
    draft.client.company,
    draft.client.contactName
      ? `${draft.client.contactName}${draft.client.role ? `, ${draft.client.role}` : ""}`
      : undefined,
  ].filter(Boolean);
  return parts.join(" / ") || "заказчик не указан";
}

function objectLine(draft: ProposalDraft): string {
  const type = draft.object.type
    ? OBJECT_TYPE_LABEL[draft.object.type]
    : undefined;
  return (
    [draft.object.address ?? draft.object.description, type, draft.object.construction]
      .filter(Boolean)
      .join(", ") || "объект не указан"
  );
}

function conditionsLines(estimate: EstimateResult): string[] {
  const c = estimate.coefficients;
  return [
    `Высота: ${HEIGHT_COEFFICIENT[c.heightBand].label} (×${HEIGHT_COEFFICIENT[c.heightBand].k})`,
    `Вода: ${WATER_COEFFICIENT[c.water].label} (×${WATER_COEFFICIENT[c.water].k})`,
    `Доступ: ${ACCESS_COEFFICIENT[c.access].label} (×${ACCESS_COEFFICIENT[c.access].k})`,
    `Сезон: ${SEASON_COEFFICIENT[c.season].label} (×${SEASON_COEFFICIENT[c.season].k})`,
    `Срок: ${URGENCY_COEFFICIENT[c.urgency].label} (×${URGENCY_COEFFICIENT[c.urgency].k})`,
  ];
}

export function formatProposal(input: {
  draft: ProposalDraft;
  estimate: EstimateResult;
  proposalNumber?: string;
  issuedAt?: string;
}): { proposalNumber: string; markdown: string; slackText: string } {
  const issued = input.issuedAt ?? new Date().toISOString().slice(0, 10);
  const proposalNumber = input.proposalNumber ?? makeProposalNumber();
  const { draft, estimate } = input;
  const validityDays =
    draft.commercial.validityDays ?? DEFAULT_VALIDITY_DAYS;
  const payment =
    draft.commercial.paymentTerms ??
    "50% аванс, 50% по акту выполненных работ";

  const lineRows = estimate.lines
    .map((line, index) => {
      const note = line.note ? ` (${line.note})` : "";
      const k =
        line.coefficientsApplied !== 1
          ? `, коэф. ×${line.coefficientsApplied}`
          : "";
      return `${index + 1}. *${line.name}*${note} — ${qty(line.quantity)} ${line.unit} × ${money(line.unitPriceRub)}${k} = *${money(line.amountRub)}*`;
    })
    .join("\n");

  const conditionBlock = conditionsLines(estimate)
    .map((line) => `• ${line}`)
    .join("\n");

  const extras: string[] = [];
  if (draft.conditions.canStopOperation === false) {
    extras.push(
      "Работы ведутся без остановки эксплуатации объекта (заложено в коэффициент доступа).",
    );
  }
  if (draft.conditions.deadline) {
    extras.push(`Желаемый срок заказчика: ${draft.conditions.deadline}.`);
  }
  if (draft.notes) extras.push(draft.notes);
  if (estimate.belowMinimum) {
    extras.push(
      `Итог ниже минимального выезда бригады (${money(estimate.minimumOrderRub)}). В договоре будет выравнено до минимума либо работы объединят с другим объёмом.`,
    );
  }

  const vatLine =
    estimate.vatMode === "none"
      ? `НДС не облагается.`
      : `НДС (${Math.round(estimate.vatRate * 100)}%): ${money(estimate.vatRub)}.`;

  const markdown = [
    `*${company.brand} — коммерческое предложение ${proposalNumber}*`,
    `Дата: ${issued} · действительно ${validityDays} календарных дней`,
    "",
    `*Заказчик:* ${clientLine(draft)}`,
    draft.client.phone || draft.client.email
      ? `Контакт: ${[draft.client.phone, draft.client.email].filter(Boolean).join(", ")}`
      : undefined,
    draft.client.inn ? `ИНН заказчика: ${draft.client.inn}` : undefined,
    `*Объект:* ${objectLine(draft)}`,
    "",
    "*Предмет:* инъекционный ремонт / гидроизоляция бетонных конструкций под ключ — диагностика, подготовка, нагнетание состава, контроль и сдача с гарантийным талоном.",
    "",
    "*Условия объекта, заложенные в расчёт:*",
    conditionBlock,
    extras.length ? `\n${extras.map((line) => `• ${line}`).join("\n")}` : undefined,
    "",
    "*Состав работ:*",
    lineRows,
    "",
    estimate.discountRub > 0
      ? `Подитог: ${money(estimate.worksSubtotalRub)}\nСкидка ${estimate.discountPercent}%: −${money(estimate.discountRub)}\n`
      : undefined,
    `Сумма без выделенного НДС: ${money(estimate.netRub)}`,
    vatLine,
    `*Итого к оплате: ${money(estimate.totalRub)}* (${vatLabel(estimate.vatMode, estimate.vatRate)})`,
    "",
    "*Сроки и оплата:*",
    `• Оплата: ${payment}`,
    "• Мобилизация бригады — в течение 3 рабочих дней после аванса (аварийный режим — в день обращения).",
    `• Гарантия: до ${company.guaranteeYears} лет, письменный талон на каждый объект.`,
    "",
    "*Что не входит, пока не согласовано отдельно:* скрытые полости сверх обмеров, демонтаж отделки, леса/автовышка, если высота не учтена, работа в выходные сверх выбранного режима, проект усиления несущих схем.",
    "",
    "*Следующий шаг:* бесплатный выезд инженера, обмер и фиксация объёмов. После осмотра смета становится твёрдой.",
    "",
    `${company.name} · ${company.phone} · ${company.email}`,
    `ИНН ${company.inn} · КПП ${company.kpp} · ОГРН ${company.ogrn}`,
    `Ориентир: ${company.objectsCompleted}+ объектов, ${company.yearsOnMarket} лет на рынке.`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  const slackText = markdown.replaceAll("*", "");

  return { proposalNumber, markdown, slackText };
}
