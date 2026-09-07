# Phase 4 — Web: Payments + Attendance (Admin/Staff tier)

## Goals
- Manual payment entry (staff marks a member as paid, cash/other)
- Razorpay integration for online payments, driven by webhook
- QR token display for each member, printable
- Browser-based QR scanning for check-in — no native app, uses the front-desk device's camera through the browser

## Tasks
1. Manual payment form: amount, method='manual', status='paid', linked to `member_id`
2. Razorpay: Supabase Edge Function (Deno/TS) as webhook receiver — verify Razorpay signature, then write the `payments` row on `payment.captured`. Webhook is the source of truth for `status='paid'`, never trust client-side confirmation alone.
3. Razorpay Checkout button on member detail page (staff/admin triggers a payment link)
4. QR code generation: use `members.qr_token`, render via a JS QR library, add "print/download QR" — this becomes a physical card/tag for the member
5. Check-in scanner page: `getUserMedia` + a browser QR-scanning library (`html5-qrcode` or `@zxing/browser`) on a dedicated `/staff/checkin` route — this is the route front desks keep open on a kiosk tablet. Member shows their printed QR, camera reads it, writes an `attendance` row.
6. Attendance table view — per-member log, populated by the scanner

## Exit criteria
- [ ] Manual payment correctly updates member's payment history
- [ ] Razorpay test-mode payment triggers webhook, correctly writes `payments` row with `status='paid'`
- [ ] QR code scans correctly through the browser scanner on real device hardware (test on an actual tablet/phone camera, not just your dev laptop webcam)
- [ ] Webhook signature verification rejects a forged/unsigned request — test this, don't assume
- [ ] Duplicate-scan handling decided and implemented (block repeat check-ins within X minutes, or log every scan — pick one, document it)

## Note
This closes out the core-ops MVP. Phase 5 covers PWA/kiosk hardening and a performance pass across everything built so far.
