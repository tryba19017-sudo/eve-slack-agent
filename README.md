This is a Slack agent for [eve](https://eve.dev) that drafts **коммерческие предложения (КП)** for Panda Core — injection crack repair and concrete waterproofing.

## What the agent does

In Slack (or `pnpm dev`), describe the object. The agent:

1. Collects the intake in one batch of questions
2. Saves a session draft
3. Prices line items from the catalog (`agent/lib/catalog.ts`)
4. Applies site coefficients (height, water, access, season, urgency)
5. Returns a formatted Russian КП with VAT 22%

It never invents totals: money comes from `calculate_estimate`.

### Information it asks for

**Required**

- Customer company **or** contact name
- Object address **or** a short description
- Scope: linear meters of cracks, m² of waterproofing, or piece counts

**Optional, but it changes the number**

- Object type (residential, business center, parking, industrial, bridge, underground)
- Structure (wall, slab, joint, foundation, column, stylobate)
- Water in the crack: dry / damp / active leak
- Working height: 0–5 / 5–15 / 15–30 / 30+ m
- Access: easy / restricted / confined
- Season (above +5 °C or winter)
- Urgency (planned / rush / 24/7 emergency)
- Whether the building must stay in operation
- Deadline, distance from Moscow (km), VAT mode, payment terms, INN

A public intake form with the same rates lives on the site under **КП**.

## Getting Started

First, link the project and pull environment variables:

```bash
vercel link
vercel env pull
```

Then, run the development server:

```bash
pnpm dev
```

Checks:

```bash
pnpm typecheck
pnpm test
```

Agent files:

- `agent/instructions.md` — identity and standing rules
- `agent/skills/create_commercial_proposal.md` — КП procedure
- `agent/tools/` — catalog, draft, estimate, formatter
- `agent/lib/` — rates, coefficients, document layout

This project uses the Eve framework's bundled guides — see `node_modules/eve/docs/` after installing dependencies.

## Learn More

- [eve documentation](https://eve.dev/docs)
- [Vercel Connect](https://vercel.com/docs) — Slack credentials for this template
- [eve GitHub repository](https://github.com/vercel/eve)
