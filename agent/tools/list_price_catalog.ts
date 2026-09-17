import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  ACCESS_COEFFICIENT,
  HEIGHT_COEFFICIENT,
  listCatalogForModel,
  OBJECT_TYPE_LABEL,
  SEASON_COEFFICIENT,
  URGENCY_COEFFICIENT,
  WATER_COEFFICIENT,
} from "../lib/catalog";
import { MINIMUM_ORDER_RUB, VAT_RATE } from "../lib/company";

export default defineTool({
  description:
    "Show Panda Core unit rates, coefficient tables, VAT, and minimum order. Call before picking line items for a commercial proposal.",
  inputSchema: z.object({}),
  async execute() {
    return {
      currency: "RUB",
      vatRate: VAT_RATE,
      minimumOrderRub: MINIMUM_ORDER_RUB,
      services: listCatalogForModel(),
      coefficients: {
        heightBand: HEIGHT_COEFFICIENT,
        water: WATER_COEFFICIENT,
        access: ACCESS_COEFFICIENT,
        season: SEASON_COEFFICIENT,
        urgency: URGENCY_COEFFICIENT,
      },
      objectTypes: OBJECT_TYPE_LABEL,
      notes: [
        "Цены ориентировочные, для КП до выезда инженера.",
        "Коэффициенты перемножаются только на позиции с applyCoefficients=true.",
        "Выезд инженера в радиусе 40 км бесплатный при заключении договора.",
      ],
    };
  },
});
