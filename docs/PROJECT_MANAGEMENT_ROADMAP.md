# Project management — future build roadmap

This document captures **what still needs to be designed, specified, and implemented** for HomeMakers project management. It is the source of truth for scope; the in-app `/project` screen is a **visual shell / demo** aligned with the product reference, not a finished backend feature set.

---

## Clarification (process)

- **Roadmap vs. UI prototype:** Product ideas (to-do, scheduling, marketplace, APIs, mandatory fields, etc.) belong here first. Shipping them requires specs, API contracts, auth, and QA — not only JSX.
- **Reference UI:** The target layout is the dashboard reference: phase strip → tasks + site feed & budget → discussion + milestones, soft panels on a warm canvas, compact sidebar (Overview … Settings).

---

## Near-term (MVP)

| Area | What to build | Notes |
|------|----------------|-------|
| **Tasks** | Real task model: assignee, due date, phase link, comments, completion audit | Replace demo array with API + optimistic UI |
| **Timeline / phases** | Persist phase % and status; drill-down per phase | Today’s gauges are static |
| **Discussion** | Threaded messages, attachments, @mentions, read receipts | Wire to realtime or polling |
| **Site feed** | Upload pipeline, live flag, gallery carousel | Storage + moderation |
| **Budget** | Actuals vs. forecast, variance alerts, export | Needs ledger integration |
| **Milestones** | Dependencies, slack/float, ICS export | Link to schedule below |
| **Documents** | Deep link from nav; folder ACL | Route exists at `/documents` |
| **Auth & project access** | Multi-tenant project membership, roles | Blocks most features above |

---

## Product backlog (your requested themes)

### 1. To-do list (distinct from “tasks”)

- [ ] Separate **quick to-dos** vs **construction tasks** (WBS-style).
- [ ] Recurrence, snooze, and “blocked by” links.
- [ ] Optional: personal vs. shared project checklist.

### 2. Scheduling

- [ ] Calendar month/week views on **Schedule** (or Timeline) tab.
- [ ] Drag site visits, holds, and milestone dates; timezone + reminders.
- [ ] Google / Outlook **read/write** sync (OAuth) — see APIs.

### 3. Marketplace

- [ ] From project: RFQ to matched pros, compare quotes, award work.
- [ ] Status sync back into **Budget** and **Tasks**.
- [ ] Nav entry only after PM ↔ marketplace contract is defined.

### 4. API connections

- [ ] Webhooks: task created, RFI answered, payment milestone released.
- [ ] API keys: create, rotate, revoke; signed payloads.
- [ ] Rate limits, retry policy, dead-letter queue for failed deliveries.
- [ ] Partner integrations (Slack/Teams) as separate OAuth apps.

### 5. Mandatory fields & gating

- [ ] Configurable **required fields** per project type (new build vs. remodel).
- [ ] Block actions (e.g. release payment, invite vendor) until checklist complete.
- [ ] Compliance docs: permit refs, COI, POC — versioned uploads.

---

## UX / UI polish (post-layout match)

- [ ] Responsive breakpoints: collapse to single column; sidebar drawer on mobile.
- [ ] Skeleton loaders and empty states for each panel.
- [ ] Accessibility: focus order, live regions for chat, contrast on status chips.

---

## Engineering foundations

- [ ] API: REST or GraphQL schema for `Project`, `Task`, `Message`, `Milestone`, `BudgetLine`.
- [ ] Realtime: WebSocket or SSE for discussion + feed.
- [ ] Notifications: email + push + in-app (bell in header).
- [ ] Audit log for money and contract-sensitive changes.

---

## Out of scope (until above stabilises)

- Full Gantt / critical path solver.
- Native mobile apps (reuse responsive web first).

---

*Last updated: product team — align this file before expanding `/project` beyond the reference shell.*
