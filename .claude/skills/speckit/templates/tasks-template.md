# Tasks: [FEATURE NAME]

**Input**: `specs/[NNN-short-name]/` (spec.md, plan.md)

Format: `- [ ] T### [P?] [US#?] Description with exact file path`
- `[P]` — can run in parallel (different files, no pending dependencies)
- `[US#]` — user story this task belongs to

## Phase 1: Setup

- [ ] T001 [description] in [path]

## Phase 2: Foundational (blocks all stories)

- [ ] T002 [description] in [path]

**Checkpoint**: foundation ready — user stories can start.

## Phase 3: User Story 1 — [Title] (P1) 🎯 MVP

**Goal**: [what this story delivers]
**Independent test**: [from spec]

- [ ] T003 [P] [US1] [description] in [path]
- [ ] T004 [US1] [description] in [path]

**Checkpoint**: US1 works on its own — `pnpm typecheck` + quickstart pass.

## Phase 4: User Story 2 — [Title] (P2)

- [ ] T005 [US2] [description] in [path]

## Phase N: Polish

- [ ] T0XX [P] Update `agent/instructions.md` / README
- [ ] T0XX Run quickstart validation from plan.md

## Dependencies

- Setup → Foundational → user stories (in priority order, or in parallel once Foundational is done) → Polish
