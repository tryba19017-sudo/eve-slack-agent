export const WORK_CODES = [
  "surface_prep",
  "surface_repair",
  "lamella_install",
  "tape_install",
  "fire_protection",
] as const;

export type WorkCode = (typeof WORK_CODES)[number];

export const MATERIAL_CODES = [
  "mapegrout_thixotropic",
  "manopox_331",
  "fibarm_lamel_14_150",
  "fibarm_resin_laminate",
  "fibarm_tape_530",
  "fibarm_resin_530",
  "iceberg_b",
] as const;

export type MaterialCode = (typeof MATERIAL_CODES)[number];

export const UNITS = ["м2", "м.п.", "кг"] as const;
export type Unit = (typeof UNITS)[number];

export const VAT_MODES = ["none", "added"] as const;
export type VatMode = (typeof VAT_MODES)[number];

export type MaterialDef = {
  code: MaterialCode;
  name: string;
  unit: Unit;
  unitPriceRub: number;
};

export type MaterialNorm = {
  materialCode: MaterialCode;
  /** Consumption per 1 unit of the parent work (installed qty). */
  perWorkUnit: number;
  /** Extra fraction, e.g. 0.1 = раскрой 10%. */
  wasteRate: number;
  note?: string;
};

export type WorkDef = {
  code: WorkCode;
  name: string;
  unit: Exclude<Unit, "кг">;
  laborUnitRub: number;
  materials: MaterialNorm[];
};

export const MATERIALS: readonly MaterialDef[] = [
  {
    code: "mapegrout_thixotropic",
    name: "Mapegrout Thixotropic",
    unit: "кг",
    unitPriceRub: 63.93,
  },
  {
    code: "manopox_331",
    name: "Манопокс 331 или аналог",
    unit: "кг",
    unitPriceRub: 1125.41,
  },
  {
    code: "fibarm_lamel_14_150",
    name: "Ламель FibArm Lamel 1.4/150",
    unit: "м.п.",
    unitPriceRub: 5716.33,
  },
  {
    code: "fibarm_resin_laminate",
    name: "Эпоксидный клей FibArm Resin Laminate+",
    unit: "кг",
    unitPriceRub: 2880.25,
  },
  {
    code: "fibarm_tape_530",
    name: "Углеродная лента FibArm Tape 530+",
    unit: "м2",
    unitPriceRub: 7275.41,
  },
  {
    code: "fibarm_resin_530",
    name: "Эпоксидное связующее FibArm Resin 530+",
    unit: "кг",
    unitPriceRub: 3853.65,
  },
  {
    code: "iceberg_b",
    name: "Огнезащита Айсберг-Б",
    unit: "кг",
    unitPriceRub: 852.46,
  },
];

export const WORKS: readonly WorkDef[] = [
  {
    code: "surface_prep",
    name: "Подготовка поверхности покрытия (очистка, шлифовка, обеспыливание) перед монтажом системы внешнего армирования композитными материалами",
    unit: "м2",
    laborUnitRub: 2632,
    materials: [],
  },
  {
    code: "surface_repair",
    name: "Ремонт поверхности цементным и эпоксидным составами",
    unit: "м2",
    laborUnitRub: 5244.41,
    materials: [
      { materialCode: "mapegrout_thixotropic", perWorkUnit: 2, wasteRate: 0 },
      { materialCode: "manopox_331", perWorkUnit: 1, wasteRate: 0 },
    ],
  },
  {
    code: "lamella_install",
    name: "Монтаж углеродной ламели",
    unit: "м.п.",
    laborUnitRub: 1967.21,
    materials: [
      {
        materialCode: "fibarm_lamel_14_150",
        perWorkUnit: 1,
        wasteRate: 0.1,
        note: "с раскроем 10%",
      },
      {
        materialCode: "fibarm_resin_laminate",
        perWorkUnit: 1.65,
        wasteRate: 0,
      },
    ],
  },
  {
    code: "tape_install",
    name: "Монтаж углеродного холста",
    unit: "м2",
    laborUnitRub: 1967.21,
    materials: [
      {
        materialCode: "fibarm_tape_530",
        perWorkUnit: 1,
        wasteRate: 0.1,
        note: "с раскроем 10%",
      },
      {
        materialCode: "fibarm_resin_530",
        perWorkUnit: 2.2,
        wasteRate: 0,
      },
    ],
  },
  {
    code: "fire_protection",
    name: "Нанесение огнезащитного состава",
    unit: "м2",
    laborUnitRub: 2250,
    materials: [
      { materialCode: "iceberg_b", perWorkUnit: 2.5, wasteRate: 0 },
    ],
  },
];

const worksByCode = new Map(WORKS.map((item) => [item.code, item]));
const materialsByCode = new Map(MATERIALS.map((item) => [item.code, item]));

export function getWork(code: string): WorkDef {
  const item = worksByCode.get(code as WorkCode);
  if (!item) {
    throw new Error(
      `Неизвестный код работы «${code}». Допустимые: ${WORK_CODES.join(", ")}.`,
    );
  }
  return item;
}

export function getMaterial(code: string): MaterialDef {
  const item = materialsByCode.get(code as MaterialCode);
  if (!item) {
    throw new Error(
      `Неизвестный код материала «${code}». Допустимые: ${MATERIAL_CODES.join(", ")}.`,
    );
  }
  return item;
}

export function listCatalogForModel() {
  return {
    laborOverheadRate: 0.3,
    vatRate: 0.22,
    works: WORKS.map((work) => ({
      code: work.code,
      name: work.name,
      unit: work.unit,
      laborUnitRub: work.laborUnitRub,
      materials: work.materials,
    })),
    materials: MATERIALS,
  };
}
