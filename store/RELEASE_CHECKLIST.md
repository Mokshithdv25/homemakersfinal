# Native release checklist

## Completed in the repository

- Bundle/package ID set to `in.homemakers.app`
- Version 1.0 / build 1 configured
- Capacitor Android and iOS projects present
- Mobile production web bundle generated and copied to both native projects
- Branded HomeMakers icons and splash screens generated for iOS and Android
- Android Studio, JDK 17, Android SDK Platform 35, Build Tools 35, and platform tools installed
- Public privacy policy and terms routes present
- In-app permanent account deletion implemented
- App Store and Play Store listing copy drafted
- Privacy and data-safety disclosures drafted

## Required before uploading

- Apply the production Supabase scripts in order: `db/homemakers_rls_hardening.sql`, then `db/homemakers_project_workspace.sql`. Use the fresh/legacy paths in `db/README.md` only when applicable; never re-run the open-demo setup after hardening.
- Run the SQL, anonymous, storage, and two-account isolation probes in `db/README.md`. Any anonymous project/billing row or exposure of a portfolio owner ID, street address, email, phone, license number, or private media blocks release.
- Require Supabase email confirmation and allow `https://www.homemakers.online/sign-in`, `https://homemakers.online/sign-in`, and `in.homemakers.app://auth/callback`.
- Set `REACT_APP_SUPABASE_URL` and the browser-safe `REACT_APP_SUPABASE_ANON_KEY` in Vercel and in ignored `frontend/.env.production.local` for native builds. Never expose the service-role key to the frontend.
- Configure production Supabase service-role, AI, CORS, and Razorpay Test Mode secrets on Render. Keep `ALLOW_AI_MOCKS=false`.
- Redeploy the Render backend and the frontend-only Vercel project from the reviewed revision. The currently deployed services predate these hardening changes and are not the release candidates.
- Verify Render returns `200` from `/health/ready`, exposes the current `/api/ai/status`, and accepts an authenticated `/api/ai/hub-assistant` request. Confirm the Vercel frontend sends API traffic to Render.
- Confirm real image packs stop at `AI_DAILY_IMAGE_PACKS` per user per UTC day with `429` and `Retry-After`; a quota-storage failure must return `503` instead of calling the provider.
- Build with Node 20 and run `npm run cap:sync`; reject any web or native bundle containing source maps, `localhost:8000`, or a temporary Capacitor `server.url`.
- Test PKCE email confirmation, password recovery, sign-out, and stale-session cleanup on installed iOS and Android builds. Test Google sign-in on web and Android; the iOS shell intentionally hides Google until Sign in with Apple is configured and verified.
- Confirm `portfolio-media` is private: an anonymous reader can obtain a short-lived signed URL only for an exact published `{owner_user_id}/{portfolio_id}/...` path, while draft, mismatched-prefix, direct-public, and expired URL probes fail.
- Review every pending portfolio before approval; test Report profile and Block profile on web, iOS, and Android; assign an owner and response SLA for the `portfolio_reports` queue.
- Confirm `support@homemakers.online` is monitored for safety and moderation escalations.
- Keep `BILLING_ENABLED=false`, `ALLOW_LIVE_BILLING=false`, and Razorpay in Test Mode. Paid webhooks record entitlements, but paid features are not yet gated by those entitlements; Live Mode keys and real charges stay blocked until entitlement enforcement and downgrade/expiry tests pass.
- Keep Razorpay checkout web-only unless the publisher enrolls in Google Play alternative billing and implements the required choice/reporting APIs; native builds currently show entitlement status without a purchase CTA
- Add StoreKit/Google Play Billing before selling digital feature access directly inside the native apps
- Create dedicated homeowner and professional review accounts
- Replace any placeholder marketing claims or testimonials that cannot be substantiated
- Confirm legal entity name, support contact, privacy policy, and disclosures with the publisher

## Android publisher actions

- Create or select the Play Console app for `in.homemakers.app`
- Generate and securely back up a Play upload keystore
- Configure release signing outside source control
- Export `HM_ANDROID_KEYSTORE`, `HM_ANDROID_STORE_PASSWORD`, `HM_ANDROID_KEY_ALIAS`, and `HM_ANDROID_KEY_PASSWORD`; the Gradle release build consumes these without committing secrets
- Upload the signed `.aab`
- Complete App access, Ads, Content rating, Target audience, Data safety, and Financial features declarations
- Upload phone screenshots and a 1024×500 feature graphic
- Choose countries, pricing, and production rollout

## iOS publisher actions

- Install full Xcode and select `/Applications/Xcode.app/Contents/Developer`
- Review and accept the Xcode license (`sudo xcodebuild -license`) before running CocoaPods or an archive build
- Sign into Xcode with the Apple Developer account
- Select the correct Team and provisioning profile for `in.homemakers.app`
- Archive and validate the app, then upload it to App Store Connect
- Create the App Store Connect app record
- Add review credentials, privacy answers, age rating, export-compliance answers, screenshots, and metadata
- Submit the selected build for review

Developer-account credentials, legal attestations, signing keys, pricing, and the final Submit for Review actions must be completed by the account owner.
