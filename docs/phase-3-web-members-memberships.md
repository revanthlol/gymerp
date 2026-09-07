# Phase 3 — Web: Members + Membership Plans (Admin/Staff tier)

## Goals
- Admin can create/edit membership plans (name, price, duration)
- Admin/staff can add, edit, view members; assign a plan to create a `membership` record
- Reuse the `<DataTable>` and form pattern from Phase 1 — just point them at your Supabase tables

## Tasks
1. `membership_plans` CRUD page — admin-only (staff sees read-only list when assigning a plan to a member)
2. `members` CRUD page — form + table, using the Phase 1 form pattern and a Zod schema for `Member`
3. Assign-plan flow: creating a `membership` record when a plan is assigned, auto-calculating `end_date` from `start_date + duration_days`
4. Member status badge (active/expired/frozen) — computed from `memberships.end_date` vs today
5. Member detail page — current membership, payment history (empty until Phase 4), attendance (empty until Phase 4)

## Exit criteria
- [ ] Admin can create a plan, assign it to a member, and see correct computed `end_date`
- [ ] Staff can view/add members but cannot edit `membership_plans` pricing — verify RLS blocks it at the DB level, not just hidden in UI
- [ ] Member list correctly reflects active/expired status
