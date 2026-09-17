This is a Slack agent for [eve](https://eve.dev) that drafts **коммерческие предложения** in the format of Группа компаний SDT: external CFRP strengthening of RC walls (FibArm lamellae and tape).

The calculator follows a live sheet (customer «МБ-Проект Бюро», walls C4/C5, 01.09.2026): labor and materials separately, **30% overhead on labor only**, VAT **22%** on top, nine standard commercial notes.

## What the agent does

1. Collects customer, object, and takeoff (wall m², lamella m, tape m²) — or a sketch BOM
2. Builds the standard package: surface prep, repair, lamella install, tape install, fire protection
3. Applies catalog unit rates and consumption (including 10% cutting waste)
4. Returns a formatted Russian КП. Totals come only from `calculate_estimate`.

### Information it needs

**Required:** заказчик; что усиливаем; площадь подготовки; погонаж ламелей; площадь холста (или таблица L × b × шт.).

**From the sketch:** crack injection and rebar inhibitor stay in design notes unless added as extra lines. Tape m² on the sheet may not equal hoop L×b — the agent keeps both numbers.

## Getting Started

The chat agent talks to **xAI Grok** (`grok-4.6`) with `XAI_API_KEY`. A Vercel AI Gateway key is not required.

1. Create `.env.local` (gitignored):

```bash
XAI_API_KEY=xai-...
```

Get the key at [console.x.ai](https://console.x.ai). Then:

```bash
pnpm install
pnpm dev:ui
```

Open `http://127.0.0.1:8080/agent`. If the key is missing, paste it on that page — it is stored only in `.env.local` on the machine that runs the agent.

`localhost` on a cloud VM is not reachable from your laptop. Use the public URL from the running session, or run `pnpm dev:ui` on your computer.

Checks:

```bash
pnpm typecheck
pnpm test
```

This project uses the Eve framework's bundled guides — see `node_modules/eve/docs/` after installing dependencies.
