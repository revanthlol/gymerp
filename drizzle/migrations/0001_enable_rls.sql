-- =============================================================================
-- GymERP PostgreSQL Row-Level Security (RLS) Migration
-- Enforces multi-tenant defense-in-depth:
-- 1. Tenants: Platform can manage all; Tenant users can only read their own row.
-- 2. Users: Platform can manage all; Tenant admins/staff manage only within their tenant.
-- 3. Core Ops: Members, Plans, Memberships, Payments, Attendance strictly isolated.
--    CRITICAL: Platform role has ZERO access policy to member-level data.
-- =============================================================================

-- Enable RLS across all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- FORCE RLS even for table owner (gymerp role)
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE membership_plans FORCE ROW LEVEL SECURITY;
ALTER TABLE members FORCE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;
ALTER TABLE attendance FORCE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1. Tenants Table Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS tenants_platform_policy ON tenants;
CREATE POLICY tenants_platform_policy ON tenants
  FOR ALL
  USING (current_setting('app.current_role', true) = 'platform');

DROP POLICY IF EXISTS tenants_tenant_read_policy ON tenants;
CREATE POLICY tenants_tenant_read_policy ON tenants
  FOR SELECT
  USING (id::text = current_setting('app.current_tenant_id', true));

-- -----------------------------------------------------------------------------
-- 2. Users Table Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS users_platform_policy ON users;
CREATE POLICY users_platform_policy ON users
  FOR ALL
  USING (current_setting('app.current_role', true) = 'platform');

DROP POLICY IF EXISTS users_tenant_policy ON users;
CREATE POLICY users_tenant_policy ON users
  FOR ALL
  USING (
    tenant_id::text = current_setting('app.current_tenant_id', true)
    AND current_setting('app.current_role', true) IN ('admin', 'staff')
  );

-- -----------------------------------------------------------------------------
-- 3. Membership Plans Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS plans_select_policy ON membership_plans;
CREATE POLICY plans_select_policy ON membership_plans
  FOR SELECT
  USING (
    tenant_id::text = current_setting('app.current_tenant_id', true)
    AND current_setting('app.current_role', true) IN ('admin', 'staff')
  );

DROP POLICY IF EXISTS plans_admin_insert_policy ON membership_plans;
CREATE POLICY plans_admin_insert_policy ON membership_plans
  FOR INSERT
  WITH CHECK (
    tenant_id::text = current_setting('app.current_tenant_id', true)
    AND current_setting('app.current_role', true) = 'admin'
  );

DROP POLICY IF EXISTS plans_admin_update_policy ON membership_plans;
CREATE POLICY plans_admin_update_policy ON membership_plans
  FOR UPDATE
  USING (
    tenant_id::text = current_setting('app.current_tenant_id', true)
    AND current_setting('app.current_role', true) = 'admin'
  );

DROP POLICY IF EXISTS plans_admin_delete_policy ON membership_plans;
CREATE POLICY plans_admin_delete_policy ON membership_plans
  FOR DELETE
  USING (
    tenant_id::text = current_setting('app.current_tenant_id', true)
    AND current_setting('app.current_role', true) = 'admin'
  );

-- -----------------------------------------------------------------------------
-- 4. Members Table Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS members_tenant_isolation ON members;
CREATE POLICY members_tenant_isolation ON members
  FOR ALL
  USING (
    tenant_id::text = current_setting('app.current_tenant_id', true)
    AND current_setting('app.current_role', true) IN ('admin', 'staff')
  );

-- -----------------------------------------------------------------------------
-- 5. Memberships Table Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS memberships_tenant_isolation ON memberships;
CREATE POLICY memberships_tenant_isolation ON memberships
  FOR ALL
  USING (
    tenant_id::text = current_setting('app.current_tenant_id', true)
    AND current_setting('app.current_role', true) IN ('admin', 'staff')
  );

-- -----------------------------------------------------------------------------
-- 6. Payments Table Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS payments_tenant_isolation ON payments;
CREATE POLICY payments_tenant_isolation ON payments
  FOR ALL
  USING (
    tenant_id::text = current_setting('app.current_tenant_id', true)
    AND current_setting('app.current_role', true) IN ('admin', 'staff')
  );

-- -----------------------------------------------------------------------------
-- 7. Attendance Table Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS attendance_tenant_isolation ON attendance;
CREATE POLICY attendance_tenant_isolation ON attendance
  FOR ALL
  USING (
    tenant_id::text = current_setting('app.current_tenant_id', true)
    AND current_setting('app.current_role', true) IN ('admin', 'staff')
  );
