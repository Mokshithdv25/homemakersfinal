# HomeMakers

Design, build, and manage your home — web app plus **iOS & Android** native shells (Capacitor).

**Product vision vs. shipped:** [docs/PLATFORM_VISION.md](docs/PLATFORM_VISION.md) — two-sided marketplace, AI design/estimates, project hub, agentic shop, milestone payment protection. **Later (not now):** lending and **AI financier matching** (project + credit score). Homepage unchanged until those ship.

## Quick start (web)

```bash
cd frontend
npm install
npm start
```

See `frontend/.env.example` for Supabase and backend URL.

## Production (Vercel + Render)

What you see on the **live site** is whatever was last deployed — not your local `npm start` unless you redeploy.

**Vercel (frontend)** — Project → Settings → Environment Variables:

| Variable | Example |
|----------|---------|
| `REACT_APP_BACKEND_URL` | `https://homemakers-6o3h.onrender.com` (no trailing `/api`) |
| `REACT_APP_SUPABASE_URL` | your Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | your anon key |

After changing env vars, trigger a **new deployment** (Deployments → Redeploy).

**Render (backend)** — ensure `XAI_API_KEY` is set so v0 returns **AI-generated** floor plans and images (not preview placeholders).

## Mobile apps (iOS & Android)

The same React app ships as native apps via Capacitor. Native projects: `frontend/ios/` and `frontend/android/`.

**Full guide:** [docs/MOBILE.md](docs/MOBILE.md)

```bash
cd frontend
npm install
cp .env.mobile.example .env.production   # set production API URLs
npm run cap:sync
npm run cap:open:ios      # Xcode
npm run cap:open:android  # Android Studio
```

## Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```
