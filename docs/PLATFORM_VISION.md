# HomeMakers — platform vision vs. what’s shipped

This doc captures the **product north star** (two-sided marketplace + AI + commerce + payments) and how it compares to **what exists in the repo today**. Use it for onboarding, roadmap prioritization, and keeping marketing honest without overselling.

**Homepage / landing:** Copy on the live marketing site is tuned separately. This file is the source of truth for **product intent**, not hero taglines.

---

## North star (one platform, both sides)

HomeMakers is a **complete home platform** where homeowners and professionals work on the **same projects** — not two disconnected products.

### Homeowner journey

1. **Create a rich project package** — brief, mood, plot, budget, and AI-assisted **design + estimates** (layouts, visuals, cost ranges). The homeowner puts in the details that matter before hiring.
2. **That package becomes the shared truth** — contractors and architects can **see scope, designs, and takeoffs** tied to the project (not a vague lead form).
3. **Match and hire** — homeowners **browse the marketplace**, use **AI contractor matching**, **invite or message** pros, and choose who works on the job. Homeowners stay in control of every hire.
4. **Run the build** — **project hub**: site visits, photos, documents, checklists, discussion, milestones. **AI assistance** on what needs attention next.
5. **Shop materials** — **agentic commerce** (Home Depot–style): AI suggests materials and quantities from the project; the homeowner **reviews and approves** before purchase.
6. **Pay with protection** — **milestone-based payment protection** and predictable payouts for pros (escrow / release on approval). **Lending and financier matching are later** — see [Deferred: financing & financier matching](#deferred-financing--financier-matching).

### Professional journey

1. **Showcase work** — portfolio, craft, service area, go-live on marketplace.
2. **Find work** — **discover homeowner projects** that fit scope and location; **choose to pursue** jobs (not only inbound spam leads).
3. **Win work** — respond to invites, quotes, or marketplace flows; align on the same **design/estimate package** the homeowner already built.
4. **Deliver** — same project hub, tasks, site feed, documents; get **paid on time** via milestone rails.

### Cross-cutting pillars

| Pillar | Intent |
|--------|--------|
| **AI design & estimates** | Turn a brief into comprehensible layouts, plans, visuals, and cost ranges — vision the family can align on before sanction drawings. |
| **AI contractor matching** | Surface the right architects/contractors for city + scope; homeowner approves every hire. |
| **Two-sided marketplace** | Homeowners post **projects**; pros **find projects** and **find deals** — both sides are active, not broadcast-only. |
| **Project management** | One hub for execution: visits, docs, tasks, team, milestones. |
| **Agentic commerce** | Materials shopping grounded in the project; human-in-the-loop approval. |
| **Payment protection** | Milestones, approvals, protected payouts — separate from lending (payments first). |
| **AI financier matching** *(later)* | Match homeowners to lenders/financiers using **project package + credit profile**; homeowner chooses. Not built; do not market yet. |

---

## Deferred: financing & financier matching

Push to a **later phase** (after payment protection and a stable project record):

- **AI-powered financier matching** — Use the same rich **project context** (scope, estimates, timeline) plus **credit score / eligibility signals** (with consent and compliance) to surface suitable lenders or construction-finance partners. Homeowner reviews options; HomeMakers does not become a lender by default.
- **General financing UX** — Loan applications, rates, disbursement tied to milestones — only with legal, KYC, and partner integrations defined.

**Until then:** No financing or “get a loan” promises on the homepage or in-app. Milestone **payment protection** (hold/release) is the near-term money story.

---

## What we built recently (May 2026 — product & marketing pass)

These changes are in the repo (some landing edits may still be local until pushed to `homemakersfinal` / Vercel):

- **Homepage (scroll, not hero overhaul)** — “Start here” with five paths: new home, remodel, project hub, **marketplace & shop**, for professionals. Balanced AI in **How it works** and **Why choose HomeMakers** (design/plans/estimates, matching, hub + agentic shop, payment protection).
- **Hero (unchanged direction)** — Strong AI headline; minimal first screen; **HomeMakers.ai** wordmark on nav/footer.
- **Homeowner UX** — Sign-in before build/remodel wizards; role-based profile menu; left back navigation; v0 → project persistence bridge (`project_v0_packs`, `persistFlowAfterV0`).
- **Pro UX** — Portfolio onboarding resume from Supabase; sign-in before portfolio wizard.
- **Production wizards** — New-home and remodel flows: sequential steps, asset URLs, remodel scope fixes, AI design pack generation (v0/Grok via backend).
- **Mobile shell** — Capacitor iOS/Android; native tab IA (home, design/ideas, build, browse, project, account); Houzz-style inspiration feed; sub-routes for shop, documents, team, journey.

---

## What exists in the app today (honest snapshot)

| Area | Status | Notes |
|------|--------|--------|
| New-home / remodel wizards | **Shipped (UI + AI gen)** | Auth-gated; generates design pack; can persist to project id when DB migration applied. |
| AI floor plans / images | **Shipped (backend)** | Requires `XAI_API_KEY` on Render; Vercel `REACT_APP_BACKEND_URL` must point at API. |
| Project hub (`/project`) | **Shell / demo** | Visual PM dashboard; most tasks/budget/milestones are not wired to live APIs. See [PROJECT_MANAGEMENT_ROADMAP.md](./PROJECT_MANAGEMENT_ROADMAP.md). |
| Marketplace / browse (`/browse`) | **Partial** | Pro discovery UI; **full project posting → pro opt-in** loop not finished. |
| Shop (`/shop`) | **Partial** | Materials UX; agentic approval loop still productized. |
| Pro onboarding & profiles | **Shipped (core)** | Craft → details → portfolio → go live; public `/profile/:slug`. |
| Pro dashboard | **Mostly demo** | Leads/analytics placeholders. |
| Messaging homeowner ↔ pro | **Not shipped** | Vision: invite + thread per project; not production-ready. |
| Contractor “see project package & opt in” | **Not shipped** | Core marketplace mechanic — highest priority after PM data model. |
| Payment protection / milestones | **Not shipped** | Copy describes intent; no live escrow/payout integration. |
| **Financing & financier matching** | **Explicitly deferred** | Vision: AI match lenders to project + credit; not built. No homepage/in-app promises. |

---

## What’s coming (recommended order)

1. **Project record as marketplace object** — Homeowner project = designs + estimates + metadata; RLS; owner vs. pro membership.
2. **Pro project feed** — List open projects (filters: city, trade, budget band); **express interest** / apply; homeowner sees applicants.
3. **Homeowner hire flow** — Shortlist, message, award; status sync to hub and budget.
4. **PM MVP** — Real tasks, phases, discussion, site uploads (see PM roadmap).
5. **Agentic shop v1** — Line items from estimate/BOM; cart approval; partner or catalog integration TBD.
6. **Payment protection v1** — Milestone definitions, hold/release, pro payout — **without** lending.
7. **AI financier matching (later)** — Project + estimate package + credit/eligibility → surfaced lender options; partner APIs, consent, compliance.
8. **Construction financing UX (maybe later)** — Only after (6) and (7) foundations; separate legal/compliance track.

---

## Marketing guardrails

- **Do** sell: AI design & estimates, two-sided marketplace, project hub, agentic materials (with human approval), payment protection on milestones.
- **Don’t** oversell: every step titled “AI”; loans, credit, or financier matching; finished marketplace/escrow if still demo.
- **Homepage** should reflect **credibility** — strong AI where it’s real (design, matching, assistance), human pros where it matters.

---

## Related docs

- [PROJECT_MANAGEMENT_ROADMAP.md](./PROJECT_MANAGEMENT_ROADMAP.md) — PM feature backlog and API themes.
- [MOBILE.md](./MOBILE.md) — Capacitor build and release.
- [README.md](../README.md) — Run locally, Vercel/Render env, deploy.

---

*Last updated: May 2026 — vision sync (payment protection near-term; financing & AI financier matching deferred).*
