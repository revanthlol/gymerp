# Phase 2 — Web: Platform Tenant Management

## Goals
- Platform creates a gym account (tenant) + that tenant's first Admin user
- Platform can suspend/reactivate a tenant — blocks Admin/Staff login when suspended, enforced at the auth layer
- Platform can view license/billing status per tenant
- This phase exists before Members/Payments because you need a real Admin account to test everything downstream

## Tasks
1. Tenant list page using the `<DataTable>` from Phase 1 — columns: name, status, created date
2. "Create tenant" form: creates a `tenants` row + `auth.users` + `users` row with `role='admin'`, `tenant_id` set to the new tenant. Send an invite/magic link, not a plaintext password.
3. Suspend/reactivate action — updates `tenants.status`. Add a check in the Admin/Staff route-group layout guard (Phase 1) that blocks access if the tenant's status is `suspended`.
4. License/billing status — manual dropdown for now (decide later whether billing status needs to be tracked separately from access status, once pricing model is settled)

## Exit criteria
- [ ] Platform can create a tenant + admin account, admin receives a working invite link
- [ ] Suspending a tenant actually blocks that tenant's admin/staff from logging in — test it
- [ ] Tenant list reflects status changes correctly
