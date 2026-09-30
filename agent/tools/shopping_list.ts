import { defineTool } from "eve/tools";
import { z } from "zod";

// Links open a store search for the item, so they always lead to real, in-stock
// products with current prices instead of product pages the model might invent.
const SHOPS = [
  { label: "Лемана ПРО", url: (q: string) => `https://lemanapro.ru/search/?q=${encodeURIComponent(q)}` },
  { label: "Ozon", url: (q: string) => `https://www.ozon.ru/search/?text=${encodeURIComponent(q)}` },
  { label: "WB", url: (q: string) => `https://www.wildberries.ru/catalog/0/search.aspx?search=${encodeURIComponent(q)}` },
  { label: "Я.Маркет", url: (q: string) => `https://market.yandex.ru/search?text=${encodeURIComponent(q)}` },
];

// Telegram rejects HTML messages over 4096 characters.
const MAX_MESSAGE = 3800;
const MAX_ENTITIES = 90;

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default defineTool({
  description:
    "Send the user a shopping list for the design: finishes (paint, wallpaper, wood slat panels, plaster, tiles, flooring, skirting) and furniture, grouped by room, with quantities and links to search each item in Russian stores. The list is sent to the chat automatically; do not repeat it in text.",
  inputSchema: z.object({
    rooms: z
      .array(
        z.object({
          room: z.string().describe("Room name in Russian, e.g. 'Гостиная'."),
          items: z
            .array(
              z.object({
                name: z.string().describe("Item in Russian, e.g. 'Акустические панели-ламели 2750×600, светлый дуб'."),
                quantity: z.string().describe("Amount with unit in Russian, e.g. '7 шт', '3 рулона', '18,5 м²', '6 л'."),
                query: z
                  .string()
                  .describe("Short Russian store search query, e.g. 'акустические панели ламели светлый дуб 2750x600'."),
              }),
            )
            .min(1),
        }),
      )
      .min(1),
  }),
  async execute({ rooms }) {
    // Telegram counts the limit on visible text, so link URLs do not count.
    const visible = (html: string) => html.replace(/<[^>]+>/g, "").length;
    // Telegram also caps formatting entities per message; stay well under 100.
    const entities = (html: string) => (html.match(/<(a|b)[ >]/g) ?? []).length;
    const messages: string[] = [];
    let current = "<b>Где купить</b> (ссылки ведут на поиск в магазине)";
    const push = (chunk: string) => {
      if (visible(current) + visible(chunk) + 1 > MAX_MESSAGE || entities(current) + entities(chunk) > MAX_ENTITIES) {
        messages.push(current);
        current = chunk.replace(/^\n+/, "");
      } else {
        current += "\n" + chunk;
      }
    };
    for (const { room, items } of rooms) {
      push(`\n<b>${escapeHtml(room)}</b>`);
      for (const it of items) {
        const links = SHOPS.map((s) => `<a href="${escapeHtml(s.url(it.query))}">${s.label}</a>`).join(" · ");
        push(`• ${escapeHtml(it.name)} — ${escapeHtml(it.quantity)}\n   ${links}`);
      }
    }
    messages.push(current);

    const count = rooms.reduce((n, r) => n + r.items.length, 0);
    return { messages, count };
  },
  toModelOutput(output) {
    return { type: "text", value: `Shopping list with ${output.count} items sent to the user.` };
  },
});
