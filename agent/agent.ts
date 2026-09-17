import { xai } from "@ai-sdk/xai";
import { defineAgent } from "eve";

// Direct xAI Grok — needs XAI_API_KEY in .env.local (not Vercel AI Gateway).
export default defineAgent({
  model: xai("grok-4.6"),
  modelContextWindowTokens: 256_000,
});
