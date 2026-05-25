# YC / investor demo checklist

Run through this **once** before sharing the live link. Production: Vercel frontend + Render API + Supabase.

## Must work (do not skip)

1. **Vercel env** — `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`, `REACT_APP_BACKEND_URL` = `https://homemakers-6o3h.onrender.com` (no `/api`). Redeploy after changes.
2. **Supabase SQL** (if not already run): `db/user_profiles.sql`, `db/homemakers_supabase_align.sql`, portfolio/marketplace migrations.
3. **Sign in with Email or Google** — not phone OTP (disabled in production).
4. **Homeowner path:** `/sign-in?role=homeowner` → `/build` → new home or remodel → generate v0 → handoff → URL must include `projectId=…`.
5. **Pro path:** `/sign-in?role=pro` → portfolio wizard → Go live → `/browse` + **`/profile/your-slug`** (only after publish; no `demo-pro` unless you create it).
6. **Public portfolio** — open your slug in an incognito window; must not show another user’s draft from this browser.

## Safe demo script (5 min)

| Step | URL / action |
|------|----------------|
| Landing | Homepage scroll — hero, Start here, How it works |
| Homeowner | Sign in (homeowner) → Build → New home → short wizard → Generate v0 → Continue to hub |
| Project hub | Confirm your project title in sidebar + v0 images (not only Unsplash if API healthy) |
| Marketplace | `/browse` — published pros (empty if none live yet) |
| Pro | Sign out → Sign in (pro) → Dashboard → Leads → Finish/preview portfolio link |

## Known limitations (OK to say out loud)

- Pro dashboard metrics are **sample data** until CRM ships.
- Milestone **payment protection** is product direction, not live escrow yet.
- Phone OTP is **coming soon**; email/Google are real auth.
- `/project` without a selected project asks you to pick one — not a fake “Sharma” demo anymore.

## If something breaks

- **Blank sign-in:** hard refresh; check Supabase env on Vercel.
- **Stock photos on v0:** Render `XAI_API_KEY`; regenerate v0 after deploy.
- **Handoff with no project:** sign in before wizard; check Supabase `projects` + align SQL.
- **Wrong name after login:** sign out, sign in again (device cache clears on user switch).
