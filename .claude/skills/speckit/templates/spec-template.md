# Feature Specification: [FEATURE NAME]

**Feature folder**: `specs/[NNN-short-name]`
**Created**: [DATE]
**Status**: Draft
**Input**: "[original user description]"

## User Scenarios & Testing *(mandatory)*

<!-- Each story must be independently testable and deliver value on its own. Order by priority. -->

### User Story 1 - [Title] (Priority: P1)

[Plain-language description of the user journey]

**Why this priority**: [value]

**Independent test**: [how to verify this story alone]

**Acceptance scenarios**:

1. **Given** [state], **When** [action], **Then** [outcome]

### User Story 2 - [Title] (Priority: P2)

...

### Edge Cases

- What happens when [boundary condition]?
- How does the system handle [error scenario]?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The agent MUST [capability]
- **FR-002**: Users MUST be able to [interaction]
- **FR-003**: The agent MUST [behavior] [NEEDS CLARIFICATION: question]

### Key Entities *(if data is involved)*

- **[Entity]**: [what it represents, key attributes, relationships — no implementation]

## Success Criteria *(mandatory)*

<!-- Measurable and technology-agnostic. -->

- **SC-001**: [e.g. "User gets an answer in Slack within 10 seconds for 95% of requests"]

## Assumptions

- [reasonable default chosen instead of asking]

## Clarifications

<!-- Filled by /speckit clarify -->

---

## Review checklist

- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value; readable by non-technical stakeholders
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable and technology-agnostic
- [ ] Edge cases and scope boundaries identified
- [ ] At most 3 `[NEEDS CLARIFICATION]` markers
