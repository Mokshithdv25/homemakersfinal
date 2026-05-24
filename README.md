# HomeMakers

Design, build, and manage your home — web app plus **iOS & Android** native shells (Capacitor).

## Quick start (web)

```bash
cd frontend
npm install
npm start
```

See `frontend/.env.example` for Supabase and backend URL.

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
