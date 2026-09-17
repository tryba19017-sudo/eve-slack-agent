export const SERVICE_CODES = [
  "survey",
  "crack_prep",
  "polymer_injection_pu",
  "polymer_injection_epoxy",
  "cement_injection",
  "joint_waterproofing",
  "curtain_grouting",
  "underground_waterproofing",
  "parking_waterproofing",
  "cfrp_strengthening",
  "crack_monitoring",
  "lab_control",
  "mobilization",
] as const;

export type ServiceCode = (typeof SERVICE_CODES)[number];

export const UNITS = ["п.м.", "м²", "шт.", "выезд", "объект", "км"] as const;
export type Unit = (typeof UNITS)[number];

export type CatalogItem = {
  code: ServiceCode;
  name: string;
  description: string;
  unit: Unit;
  unitPriceRub: number;
  applyCoefficients: boolean;
};

export const CATALOG: readonly CatalogItem[] = [
  {
    code: "survey",
    name: "Выезд инженера и диагностика",
    description:
      "Осмотр объекта, разметка трещин, фотофиксация, рекомендации по составу. В радиусе 40 км от Москвы — без оплаты при заключении договора.",
    unit: "выезд",
    unitPriceRub: 0,
    applyCoefficients: false,
  },
  {
    code: "crack_prep",
    name: "Разделка и подготовка трещины",
    description:
      "Очистка, разделка устья, сверление шпуров, установка пакеров и грунтование зоны ремонта.",
    unit: "п.м.",
    unitPriceRub: 850,
    applyCoefficients: true,
  },
  {
    code: "polymer_injection_pu",
    name: "Инъекция полиуретановой смолой",
    description:
      "Эластичная герметизация активных и водонесущих трещин. Останавливает фильтрацию, сохраняет подвижность шва.",
    unit: "п.м.",
    unitPriceRub: 4_900,
    applyCoefficients: true,
  },
  {
    code: "polymer_injection_epoxy",
    name: "Инъекция эпоксидной смолой",
    description:
      "Силовое склеивание статичных трещин в несущих конструкциях. Восстанавливает монолитность бетона.",
    unit: "п.м.",
    unitPriceRub: 5_600,
    applyCoefficients: true,
  },
  {
    code: "cement_injection",
    name: "Цементная инъекция пустот",
    description:
      "Заполнение крупных полостей и восстановление сплошности массивных конструкций микроцементом.",
    unit: "п.м.",
    unitPriceRub: 3_200,
    applyCoefficients: true,
  },
  {
    code: "joint_waterproofing",
    name: "Гидроизоляция деформационных и рабочих швов",
    description:
      "Инъектирование швов, герметизация стыков плит, остановка фильтрации в местах сопряжения конструкций.",
    unit: "п.м.",
    unitPriceRub: 4_100,
    applyCoefficients: true,
  },
  {
    code: "curtain_grouting",
    name: "Противофильтрационная завеса",
    description:
      "Curtain grouting за конструкцию: создание грунтово-полимерного экрана при активных течах.",
    unit: "м²",
    unitPriceRub: 7_200,
    applyCoefficients: true,
  },
  {
    code: "underground_waterproofing",
    name: "Гидроизоляция подземных частей",
    description:
      "Инъекционная защита фундаментов, приямков, тоннелей и стен в грунте от грунтовых вод.",
    unit: "м²",
    unitPriceRub: 5_800,
    applyCoefficients: true,
  },
  {
    code: "parking_waterproofing",
    name: "Гидроизоляция паркинга и стилобата",
    description:
      "Ремонт и герметизация плит перекрытия, рамп и деформационных швов эксплуатируемого паркинга.",
    unit: "м²",
    unitPriceRub: 4_400,
    applyCoefficients: true,
  },
  {
    code: "cfrp_strengthening",
    name: "Усиление углеродной лентой (CFRP)",
    description:
      "Композитное усиление изгибаемых и сжатых элементов углеродным волокном по расчёту.",
    unit: "м²",
    unitPriceRub: 9_400,
    applyCoefficients: true,
  },
  {
    code: "crack_monitoring",
    name: "Датчик раскрытия трещины",
    description:
      "Установка механического или электронного маяка, первичное снятие показаний, акт.",
    unit: "шт.",
    unitPriceRub: 12_500,
    applyCoefficients: false,
  },
  {
    code: "lab_control",
    name: "Лабораторный контроль качества",
    description:
      "Проверка заполнения полости, адгезии состава и оформление протокола на объект.",
    unit: "объект",
    unitPriceRub: 28_000,
    applyCoefficients: false,
  },
  {
    code: "mobilization",
    name: "Мобилизация за пределы 40 км",
    description:
      "Доставка бригады, оборудования и материалов. Считается от МКАД / КАД, в одну сторону.",
    unit: "км",
    unitPriceRub: 85,
    applyCoefficients: false,
  },
] as const;

export const HEIGHT_BANDS = ["0-5", "5-15", "15-30", "30+"] as const;
export type HeightBand = (typeof HEIGHT_BANDS)[number];

export const WATER_CONDITIONS = ["dry", "damp", "active_leak"] as const;
export type WaterCondition = (typeof WATER_CONDITIONS)[number];

export const ACCESS_LEVELS = ["easy", "restricted", "confined"] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export const SEASONS = ["above_5c", "winter"] as const;
export type Season = (typeof SEASONS)[number];

export const URGENCY_LEVELS = ["normal", "rush", "emergency"] as const;
export type Urgency = (typeof URGENCY_LEVELS)[number];

export const VAT_MODES = ["none", "included", "added"] as const;
export type VatMode = (typeof VAT_MODES)[number];

export const OBJECT_TYPES = [
  "residential",
  "business_center",
  "parking",
  "industrial",
  "bridge",
  "underground",
  "other",
] as const;
export type ObjectType = (typeof OBJECT_TYPES)[number];

export const HEIGHT_COEFFICIENT: Record<HeightBand, { k: number; label: string }> = {
  "0-5": { k: 1, label: "до 5 м" },
  "5-15": { k: 1.15, label: "5–15 м" },
  "15-30": { k: 1.3, label: "15–30 м" },
  "30+": { k: 1.5, label: "свыше 30 м / высотка" },
};

export const WATER_COEFFICIENT: Record<WaterCondition, { k: number; label: string }> = {
  dry: { k: 1, label: "сухо, без фильтрации" },
  damp: { k: 1.12, label: "влажно, капиллярный подсос" },
  active_leak: { k: 1.35, label: "активная течь / напор" },
};

export const ACCESS_COEFFICIENT: Record<AccessLevel, { k: number; label: string }> = {
  easy: { k: 1, label: "свободный доступ" },
  restricted: { k: 1.18, label: "ограниченный доступ, работа без остановки объекта" },
  confined: { k: 1.4, label: "тесные/замкнутые пространства, ночные окна" },
};

export const SEASON_COEFFICIENT: Record<Season, { k: number; label: string }> = {
  above_5c: { k: 1, label: "температура бетона выше +5 °C" },
  winter: { k: 1.15, label: "зимние работы / прогрев" },
};

export const URGENCY_COEFFICIENT: Record<Urgency, { k: number; label: string }> = {
  normal: { k: 1, label: "плановый график" },
  rush: { k: 1.25, label: "ускоренный срок (до 7 дней)" },
  emergency: { k: 1.5, label: "аварийный выезд 24/7" },
};

export const OBJECT_TYPE_LABEL: Record<ObjectType, string> = {
  residential: "жилой комплекс",
  business_center: "бизнес-центр",
  parking: "паркинг / стилобат",
  industrial: "промышленный объект",
  bridge: "мост / путепровод",
  underground: "подземное сооружение",
  other: "иной объект",
};

const catalogByCode = new Map(CATALOG.map((item) => [item.code, item]));

export function getCatalogItem(code: string): CatalogItem {
  const item = catalogByCode.get(code as ServiceCode);
  if (!item) {
    const known = SERVICE_CODES.join(", ");
    throw new Error(`Неизвестный код услуги «${code}». Допустимые: ${known}.`);
  }
  return item;
}

export function listCatalogForModel() {
  return CATALOG.map((item) => ({
    code: item.code,
    name: item.name,
    description: item.description,
    unit: item.unit,
    unitPriceRub: item.unitPriceRub,
    applyCoefficients: item.applyCoefficients,
  }));
}
