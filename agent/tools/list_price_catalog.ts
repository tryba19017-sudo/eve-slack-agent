import { defineTool } from "eve/tools";
import { z } from "zod";
import { listCatalogForModel } from "../lib/catalog";

export default defineTool({
  description:
    "Show SDT unit rates for CFRP strengthening: labor, 30% overhead, material prices and consumption norms. Call before building a commercial proposal.",
  inputSchema: z.object({}),
  async execute() {
    return {
      currency: "RUB",
      ...listCatalogForModel(),
      notes: [
        "Цены из рабочего КП SDT (усиление стен С4/С5, сентябрь 2026).",
        "Накладные 30% начисляются только на работу.",
        "Раскрой ламели и холста — +10% к установленному количеству.",
        "НДС 22% сверху, если заказчик не сказал иное.",
      ],
    };
  },
});
