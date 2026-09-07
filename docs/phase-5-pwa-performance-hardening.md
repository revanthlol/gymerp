# Phase 5 — PWA Kiosk Hardening + Performance Pass

## Goals
- Lock down the shared-kiosk security concern for real (not just Phase 1's basic SW scoping)
- Hit Core Web Vitals targets across all role dashboards
- Make `/staff/checkin` genuinely kiosk-durable (works on a flaky gym-WiFi connection, doesn't leak between shifts/staff sessions)

## Tasks
1. **Cache audit** — using DevTools Application tab, confirm zero API/Supabase responses are present in the Serwist cache across all three route groups, not just the ones you tested in Phase 1
2. **Logout cache clear** — on logout, explicitly clear the SW cache and any client-side storage (not just the Supabase session token) — write this as a single `clearSessionArtifacts()` call invoked from every logout path, don't scatter ad-hoc clearing logic
3. **Kiosk resilience on `/staff/checkin`** — queue scanned attendance events locally if the network drops mid-scan, flush to Supabase when connection returns (a simple IndexedDB queue is enough, don't reach for a full offline-sync framework for one table)
4. **Performance pass:**
   - Run Lighthouse against `/admin`, `/staff`, `/platform` home pages — target LCP < 2.5s, INP < 200ms, CLS < 0.1
   - Confirm dashboard tables render via Server Components where the data doesn't need client interactivity beyond what `<DataTable>` provides
   - Check bundle size — `next build` output, flag any route pulling in more client JS than expected (a stray non-tree-shaken import is the usual culprit)
5. **Manifest polish** — proper icon set (192px/512px, maskable variant), correct `theme_color`/`background_color`, verify "Add to Home Screen" prompt behaves correctly on Android Chrome (the realistic kiosk device)

## Exit criteria
- [ ] Cache audit clean across all route groups
- [ ] Logging out on a shared device leaves zero recoverable session/API data behind
- [ ] Check-in scanner survives a simulated network drop without losing a scan
- [ ] Lighthouse scores meet targets on all three dashboards
- [ ] PWA installs cleanly on an actual Android tablet, not just desktop Chrome
