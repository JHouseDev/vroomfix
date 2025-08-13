-- Enable Row Level Security for Fleet Service Management System
-- Fixed version that handles system tables correctly

-- =============================================
-- HELPER FUNCTIONS FOR RLS
-- =============================================

-- Function to get current user's tenant_id
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT tenant_id 
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid() 
    AND r.name = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user role
CREATE OR REPLACE FUNCTION has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid() 
    AND r.name = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

-- System tables (no tenant isolation needed)
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_statuses ENABLE ROW LEVEL SECURITY;

-- Multi-tenant tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SYSTEM TABLES POLICIES (No tenant isolation)
-- =============================================

-- Subscription tiers - readable by all, writable by super admins
CREATE POLICY "subscription_tiers_read" ON subscription_tiers
  FOR SELECT USING (true);

CREATE POLICY "subscription_tiers_write" ON subscription_tiers
  FOR ALL USING (is_super_admin());

-- Roles - readable by all, writable by super admins
CREATE POLICY "roles_read" ON roles
  FOR SELECT USING (true);

CREATE POLICY "roles_write" ON roles
  FOR ALL USING (is_super_admin());

-- Job statuses - readable by all, writable by admins and super admins
CREATE POLICY "job_statuses_read" ON job_statuses
  FOR SELECT USING (true);

CREATE POLICY "job_statuses_write" ON job_statuses
  FOR ALL USING (is_super_admin() OR has_role('admin'));

-- =============================================
-- TENANT MANAGEMENT POLICIES
-- =============================================

-- Tenants - super admins see all, others see only their tenant
CREATE POLICY "tenants_super_admin" ON tenants
  FOR ALL USING (is_super_admin());

CREATE POLICY "tenants_own_tenant" ON tenants
  FOR SELECT USING (id = get_user_tenant_id());

CREATE POLICY "tenants_admin_update" ON tenants
  FOR UPDATE USING (id = get_user_tenant_id() AND has_role('admin'));

-- =============================================
-- USER MANAGEMENT POLICIES
-- =============================================

-- Users - complex policies for multi-tenant user management
CREATE POLICY "users_super_admin" ON users
  FOR ALL USING (is_super_admin());

CREATE POLICY "users_same_tenant" ON users
  FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "users_admin_manage" ON users
  FOR ALL USING (
    tenant_id = get_user_tenant_id() 
    AND (has_role('admin') OR has_role('manager'))
  );

CREATE POLICY "users_own_profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- =============================================
-- CLIENT AND VEHICLE POLICIES
-- =============================================

-- Clients - tenant isolation
CREATE POLICY "clients_tenant_access" ON clients
  FOR ALL USING (
    is_super_admin() OR tenant_id = get_user_tenant_id()
  );

-- Vehicles - tenant isolation
CREATE POLICY "vehicles_tenant_access" ON vehicles
  FOR ALL USING (
    is_super_admin() OR tenant_id = get_user_tenant_id()
  );

-- =============================================
-- INVENTORY POLICIES
-- =============================================

-- Part categories - tenant isolation
CREATE POLICY "part_categories_tenant_access" ON part_categories
  FOR ALL USING (
    is_super_admin() OR tenant_id = get_user_tenant_id()
  );

-- Parts - tenant isolation
CREATE POLICY "parts_tenant_access" ON parts
  FOR ALL USING (
    is_super_admin() OR tenant_id = get_user_tenant_id()
  );

-- =============================================
-- JOB WORKFLOW POLICIES
-- =============================================

-- Jobs - tenant isolation with role-based access
CREATE POLICY "jobs_tenant_access" ON jobs
  FOR ALL USING (
    is_super_admin() OR tenant_id = get_user_tenant_id()
  );

-- Quotes - tenant isolation
CREATE POLICY "quotes_tenant_access" ON quotes
  FOR ALL USING (
    is_super_admin() OR tenant_id = get_user_tenant_id()
  );

-- Quote items - access through parent quote
CREATE POLICY "quote_items_access" ON quote_items
  FOR ALL USING (
    is_super_admin() OR 
    EXISTS (
      SELECT 1 FROM quotes q 
      WHERE q.id = quote_items.quote_id 
      AND q.tenant_id = get_user_tenant_id()
    )
  );

-- =============================================
-- INVOICING POLICIES
-- =============================================

-- Invoices - tenant isolation
CREATE POLICY "invoices_tenant_access" ON invoices
  FOR ALL USING (
    is_super_admin() OR tenant_id = get_user_tenant_id()
  );

-- Invoice items - access through parent invoice
CREATE POLICY "invoice_items_access" ON invoice_items
  FOR ALL USING (
    is_super_admin() OR 
    EXISTS (
      SELECT 1 FROM invoices i 
      WHERE i.id = invoice_items.invoice_id 
      AND i.tenant_id = get_user_tenant_id()
    )
  );

-- =============================================
-- PURCHASE MANAGEMENT POLICIES
-- =============================================

-- Purchase requests - tenant isolation
CREATE POLICY "purchase_requests_tenant_access" ON purchase_requests
  FOR ALL USING (
    is_super_admin() OR tenant_id = get_user_tenant_id()
  );

-- Purchase request items - access through parent request
CREATE POLICY "purchase_request_items_access" ON purchase_request_items
  FOR ALL USING (
    is_super_admin() OR 
    EXISTS (
      SELECT 1 FROM purchase_requests pr 
      WHERE pr.id = purchase_request_items.purchase_request_id 
      AND pr.tenant_id = get_user_tenant_id()
    )
  );

-- =============================================
-- CALENDAR AND ACTIVITY POLICIES
-- =============================================

-- Calendar events - tenant isolation
CREATE POLICY "calendar_events_tenant_access" ON calendar_events
  FOR ALL USING (
    is_super_admin() OR tenant_id = get_user_tenant_id()
  );

-- Activity logs - tenant isolation, read-only for most users
CREATE POLICY "activity_logs_tenant_read" ON activity_logs
  FOR SELECT USING (
    is_super_admin() OR tenant_id = get_user_tenant_id()
  );

CREATE POLICY "activity_logs_system_write" ON activity_logs
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id() OR is_super_admin()
  );

-- =============================================
-- GRANT NECESSARY PERMISSIONS
-- =============================================

-- Grant usage on helper functions
GRANT EXECUTE ON FUNCTION get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION has_role(TEXT) TO authenticated;

-- Grant basic table permissions to authenticated users
-- The RLS policies will handle the actual access control
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
