# HomeMakers

India’s home platform: AI design and estimates, marketplace, project hub, and materials — homeowners and pros on the same projects.

**Repo:** [homemakersfinal](https://github.com/Mokshithdv25/homemakersfinal) → deploys to production via Vercel.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Web + mobile app (React, Capacitor iOS/Android)            │
│  Hosted on Vercel                                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐
│  Supabase   │   │  Render     │   │  xAI (Grok)         │
│  Auth, DB,  │   │  FastAPI    │   │  Floor plans &      │
│  storage    │   │  backend    │   │  design images      │
└─────────────┘   └─────────────┘   └─────────────────────┘

Domain / DNS: Ionos
Source control: GitHub
```

| Layer | Role |
|--------|------|
| **Frontend** | React (CRA + CRACO), Tailwind, Framer Motion; Capacitor for native shells |
| **Backend** | Python FastAPI on Render — AI generation, project flow APIs |
| **Data** | Supabase (Postgres, auth, file storage) |
| **AI** | Grok via xAI API (`XAI_API_KEY` on Render) |
| **Hosting** | Vercel (app), Render (API), Ionos (domain) |

---

## Capabilities today

**Homeowners**

- New-home and remodel wizards with **AI layouts, visuals, and estimates**
- Sign-in–gated flows; project pack can persist to Supabase
- Marketing site and inspiration content
- Project hub for saved v0 packs, briefs, and seeded phases/tasks after handoff
- Browse marketplace and shop (catalog UI; checkout not live)

**Professionals**

- Onboarding: craft → details → portfolio → go live
- Public portfolio (`/profile/:slug`)
- Pro dashboard and leads UI (sample metrics labeled in-app where applicable)

**Mobile**

- Capacitor apps (iOS / Android) sharing the same React codebase

**Not built yet**

- Two-sided “project posted → pro opts in” marketplace loop
- Homeowner ↔ pro messaging and hire/award flow
- Live milestone **payment protection** (escrow / payouts)
- Full agentic materials checkout
- **Financing / AI financier matching** (project + credit) — later

---

## Vision & roadmap

**North star:** One place from idea to move-in. Homeowner builds a rich **project package** (design + estimates + details). Contractors **see it and choose to work on it**; homeowners **pick and message** pros. Same hub for execution, **agentic materials shopping** (AI suggests, human approves), and **milestone payment protection**.

**Next (in order)**

1. Project as a marketplace object (shared designs/estimates, access control)
2. Pro project feed — discover jobs, express interest
3. Hire flow — shortlist, message, award
4. Project management MVP — real tasks, phases, site feed, discussion
5. Agentic shop v1 — BOM-linked materials, approval before buy
6. Payment protection v1 — milestones, hold/release, pro payouts

**Later**

- AI **financier matching** (project context + credit score, with consent/compliance)
- Construction financing UX (partners, legal) — only after payments core

---

## Stack & tools

| Tool | Use |
|------|-----|
| **GitHub** | Source, `homemakersfinal` main branch |
| **Vercel** | Production frontend |
| **Render** | Production API |
| **Supabase** | Database, auth, storage |
| **Ionos** | Domain / DNS |
| **xAI (Grok)** | AI floor plans and design images |
| **Capacitor** | Native iOS & Android |
| **FastAPI** | Backend |
| **React** | Web and mobile UI |

---

*Detailed PM backlog: [docs/PROJECT_MANAGEMENT_ROADMAP.md](docs/PROJECT_MANAGEMENT_ROADMAP.md). Native build notes: [docs/MOBILE.md](docs/MOBILE.md). Pitch competitor framing: [docs/COMPETITIVE_POSITIONING.md](docs/COMPETITIVE_POSITIONING.md) (Material Depot, Room Story AI, Livspace / Homelane vs. us).*
