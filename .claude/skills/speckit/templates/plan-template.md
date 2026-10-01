# Implementation Plan: [FEATURE NAME]

**Feature folder**: `specs/[NNN-short-name]` | **Date**: [DATE] | **Spec**: [spec.md](./spec.md)

## Summary

[Primary requirement + chosen technical approach, 2–4 sentences]

## Technical Context

- **Language/Version**: TypeScript (see `tsconfig.json`)
- **Framework**: Eve (`eve` package) — guides consulted: [list files from `node_modules/eve/dist/docs/public/`]
- **Primary dependencies**: [e.g. `ai`, `zod`, `@vercel/connect`]
- **Channels**: [e.g. Slack via `agent/channels/slack.ts`]
- **Storage**: [if applicable or N/A]
- **Testing**: [`pnpm typecheck`, evals, manual Slack check]
- **Deployment**: Vercel
- **Performance / constraints**: [or NEEDS CLARIFICATION]

## Constitution Check

*Gate: must pass before design and be re-checked after design.*

| Principle | Status | Notes |
|---|---|---|
| [I. …] | ✅ / ⚠️ | |

## Project Structure

```text
agent/
├── agent.ts
├── instructions.md
├── channels/
├── skills/
└── tools/
specs/[NNN-short-name]/
├── spec.md
├── plan.md
└── tasks.md
```

**Files to add/change**: [exact paths]

## Data Model

[Entities, fields, validation rules (zod), state transitions]

## Contracts

[Tool definitions: name, description, input zod schema, output shape; webhook/endpoints]

## Research & Decisions

| Decision | Rationale | Alternatives considered |
|---|---|---|

## Quickstart Validation

1. [Step to run locally: `pnpm dev`]
2. [Message to send in Slack and expected reply]

## Complexity Tracking

*Only fill if the Constitution Check has violations that must be justified.*

| Violation | Why needed | Simpler alternative rejected because |
|---|---|---|
