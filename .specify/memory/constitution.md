<!--
Sync Impact Report
- Version: 1.0.0 (initial)
- Principles added: I–V
- Templates: .claude/skills/speckit/templates/* aligned
-->

# Eve Slack Agent Constitution

## Core Principles

### I. Eve Framework First
Use the Eve framework's conventions and APIs. Before you write code, read the relevant guide in `node_modules/eve/dist/docs/public/`. Don't add parallel infrastructure for something Eve already provides.

### II. Spec Before Code
A non-trivial feature starts as `specs/NNN-name/spec.md` (what and why), then gets `plan.md` (how) and `tasks.md` (steps). Implementation follows the tasks.

### III. Small, Typed Tools
Each agent tool in `agent/tools/` does one thing, validates its input with `zod`, and returns structured output. The agent's behavior lives in `agent/instructions.md`, not scattered across the code.

### IV. Type Safety Gate
`pnpm typecheck` must pass before every commit. Use no `any` unless it is justified in the plan.

### V. Simplicity & Secrets Hygiene
Prefer the simplest design that meets the spec (YAGNI). Credentials come only from environment variables or Vercel Connect, never from source or committed files.

## Governance

This constitution overrides other practices. Amendments are made with `/speckit constitution` and versioned with semver (MAJOR: a principle is removed or redefined; MINOR: one is added; PATCH: wording changes). Every plan includes a Constitution Check.

**Version**: 1.0.0 | **Ratified**: 2026-10-01 | **Last Amended**: 2026-10-01
