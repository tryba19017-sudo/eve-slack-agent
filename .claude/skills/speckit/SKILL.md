---
name: speckit
description: Spec-driven development workflow modeled on GitHub Spec Kit (https://github.com/github/spec-kit). Use when the user wants to build a new feature "by spec", or says constitution / specify / clarify / plan / tasks / implement / speckit (also in Russian: "спецификация", "спека", "по спеке", "план", "задачи"). Produces specs/NNN-feature/{spec,plan,tasks}.md and then implements them.
---

# Spec Kit workflow

The phases run in order. Each phase writes one file and stops for the user to review it. Don't skip ahead unless the user asks for that.
Reply in the user's language (Russian if they write in Russian). Write the artifact files in English unless the user asks for another language.

Usage: `/speckit <phase> [arguments]`. With no phase, look at the latest `specs/NNN-*/` folder and suggest the next phase.

| Phase | Input | Output |
|---|---|---|
| `constitution` | project principles | `.specify/memory/constitution.md` |
| `specify` | feature description (what and why) | `specs/NNN-short-name/spec.md` |
| `clarify` | existing spec | answers merged into `spec.md` |
| `plan` | tech choices (how) | `specs/NNN-short-name/plan.md` |
| `tasks` | plan | `specs/NNN-short-name/tasks.md` |
| `analyze` | spec + plan + tasks | consistency report (chat only, no file edits) |
| `implement` | tasks | code, with tasks ticked off as they're done |

Templates are in `templates/` next to this file. Read the matching template before you write an artifact.

## Ground rules

- Read `.specify/memory/constitution.md` before every phase. The plan and the code must not violate it. If a violation is truly needed, record it and the reason in the plan's "Complexity tracking" table.
- This is an Eve project. Before `plan` or `implement`, read the relevant guides in `node_modules/eve/dist/docs/public/`. If `node_modules` is missing, run `pnpm install` first.
- Mark every ambiguity as `[NEEDS CLARIFICATION: question]` and never guess silently. Use no more than 3 of these per spec; pick reasonable defaults for the rest and list them under "Assumptions".

## Phases

### constitution
Fill in `.specify/memory/constitution.md` from the user's input and the codebase (`AGENTS.md`, `package.json`, `agent/`). Bump its version: MAJOR when a principle is removed or redefined, MINOR when one is added, PATCH for wording changes. Update the Sync Impact Report comment at the top.

### specify
1. Find the highest `NNN` under `specs/` and add 1 (start at `001`). Pick a 2–4 word kebab-case short name.
2. If the working tree is clean and the current branch is not a `claude/*` or other assigned branch, create a git branch `NNN-short-name`. Otherwise stay on the current branch.
3. Write `spec.md` from `templates/spec-template.md`. Describe **what** users need and **why**. Leave out the tech stack, APIs, and code structure.
4. Check the spec against the "Review checklist" in the template and fix what fails.

### clarify
Scan the spec for gaps: scope, user roles, data, edge cases, failure handling, non-functional targets. Ask at most 5 questions, one at a time. Offer 2–4 options per question and put a recommended one first. After each answer, update the affected section of `spec.md` and log it under `## Clarifications / ### Session YYYY-MM-DD`.

### plan
1. Refuse to start while `[NEEDS CLARIFICATION]` markers remain, unless the user explicitly accepts the risk.
2. Write `plan.md` from `templates/plan-template.md`: technical context, constitution check, project structure (real paths in this repo), data model, contracts (tool input/output schemas, webhooks), and a quickstart validation scenario.
3. Re-run the constitution check after the design is done.

### tasks
Write `tasks.md` from `templates/tasks-template.md`. Group the tasks by user story in priority order (P1 first) so each story can be delivered and tested on its own. Format each task as `- [ ] T001 [P] [US1] Description with exact file path`. Use `[P]` only for tasks that touch different files and have no unfinished dependencies.

### analyze
Read-only. Cross-check spec ↔ plan ↔ tasks: requirements with no tasks, tasks with no requirement, terminology drift, conflicts with the constitution, and unresolved markers. Report a table of findings with severity (CRITICAL/HIGH/MEDIUM/LOW) and suggested fixes. Don't edit files.

### implement
1. Check that `tasks.md` exists and that `analyze` found no CRITICAL issues.
2. Do the tasks phase by phase: Setup → Foundational → US1 → US2 → … → Polish. Respect dependencies; `[P]` tasks may run together.
3. After each task, change `- [ ]` to `- [x]` in `tasks.md`.
4. After each user story, run `pnpm typecheck` and validate against the quickstart in `plan.md`. Stop and report if something fails.
5. Commit at the end of each phase with a message that references the task IDs.
