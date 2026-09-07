# Phase 0 — Foundation: Supabase Schema + RLS + Auth (4-tier)

**Do this phase yourself — don't hand RLS policy design to a coding agent unsupervised.** This is the layer that makes "Platform can't touch member data" actually true instead of a UI-level suggestion.

**Note:** Supabase's Auth Hooks / custom claims API has shifted over time — verify the exact current syntax against Supabase's docs when you implement this, don't blindly copy the SQL below as gospel if it's been a while since you wrote it.

## Goals
- Stand up Supabase project
- Define schema for MVP entities, including `tenants.status` for Platform-level lifecycle management
- Write and test RLS policies for every table — hard rule: **no policy grants `platform` role access to member-level tables, ever, by default**
- Set up auth roles (platform/admin/staff) via JWT custom claims

## Schema

```sql
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text check (status in ('trial','active','suspended')) default 'trial',
  created_at timestamptz default now()
);

create table users (
  id uuid primary key references auth.users(id),
  tenant_id uuid references tenants(id), -- null for platform-role users
  role text check (role in ('platform','admin','staff')) not null,
  full_name text,
  created_at timestamptz default now()
);

create table membership_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,
  name text not null,
  price numeric not null,
  duration_days int not null,
  created_at timestamptz default now()
);

create table members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,
  full_name text not null,
  contact_info text,
  join_date date default now(),
  status text check (status in ('active','expired','frozen')) default 'active',
  qr_token uuid default gen_random_uuid() unique
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,
  member_id uuid references members(id) not null,
  plan_id uuid references membership_plans(id) not null,
  start_date date not null,
  end_date date not null,
  status text check (status in ('active','expired','cancelled')) default 'active'
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,
  member_id uuid references members(id) not null,
  amount numeric not null,
  method text check (method in ('razorpay','manual')) not null,
  status text check (status in ('pending','paid','failed')) not null,
  razorpay_payment_id text,
  paid_at timestamptz
);

create table attendance (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,
  member_id uuid references members(id) not null,
  checked_in_at timestamptz default now(),
  method text default 'qr'
);
```

`members` has no `user_id`/login — they're records, not accounts, per the MVP decision to drop member self-service.

## RLS policies

**Tenant-scoped tables** (`members`, `membership_plans`, `memberships`, `payments`, `attendance`):

```sql
alter table members enable row level security;

create policy tenant_scoped_access on members
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'role') in ('admin','staff')
  );
```

Repeat for `membership_plans`, `memberships`, `payments`, `attendance`. Add a stricter `insert`/`update` policy on `membership_plans` requiring `role = 'admin'` (staff read-only on pricing).

**`tenants` table** — platform-only, with a narrow self-read exception:

```sql
alter table tenants enable row level security;

create policy platform_manages_tenants on tenants
  using ((auth.jwt() ->> 'role') = 'platform');

create policy tenant_self_read on tenants
  for select
  using (id = (auth.jwt() ->> 'tenant_id')::uuid);
```

**Do not** write a policy anywhere that lets `role = 'platform'` touch `members`/`payments`/`attendance`/`memberships`/`membership_plans`. The absence is the whole point.

## Auth / claims
Postgres function + Supabase Auth Hook injects `role` and `tenant_id` (null for platform users) into the JWT on login.

## Exit criteria
- [ ] All tenant-scoped tables have RLS enabled, admin/staff can only see their own tenant's rows
- [ ] A `platform`-role session **cannot** select from `members`, `payments`, or `attendance` — confirm this fails, don't assume
- [ ] A `platform`-role session **can** create/suspend a tenant row
- [ ] Staff session blocked from `insert`/`update` on `membership_plans` pricing fields
