-- Enable RLS and create security policies for all tables
-- This is CRITICAL for multi-tenant data isolation

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's tenant_id
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

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name = 'super_admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name = role_name
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TENANTS TABLE POLICIES
-- Super admins can see all tenants, others can only see their own
CREATE POLICY "Super admins can view all tenants" ON tenants
  FOR SELECT USING (is_super_admin());

CREATE POLICY "Users can view their own tenant" ON tenants
  FOR SELECT USING (id = get_user_tenant_id());

CREATE POLICY "Super admins can manage all tenants" ON tenants
  FOR ALL USING (is_super_admin());

-- USERS TABLE POLICIES
-- Users can view users in their tenant, super admins can view all
CREATE POLICY "Users can view users in their tenant" ON users
  FOR SELECT USING (
    tenant_id = get_user_tenant_id() OR is_super_admin()
  );

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage users in their tenant" ON users
  FOR ALL USING (
    (tenant_id = get_user_tenant_id() AND has_role('admin')) OR 
    is_super_admin()
  );

-- CLIENTS TABLE POLICIES
CREATE POLICY "Users can view clients in their tenant" ON clients
  FOR SELECT USING (tenant_id = get_user_tenant_id() OR is_super_admin());

CREATE POLICY "Users can manage clients in their tenant" ON clients
  FOR ALL USING (
    tenant_id = get_user_tenant_id() OR is_super_admin()
  );

-- VEHICLES TABLE POLICIES
CREATE POLICY "Users can view vehicles in their tenant" ON vehicles
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE tenant_id = get_user_tenant_id()
    ) OR is_super_admin()
  );

CREATE POLICY "Users can manage vehicles in their tenant" ON vehicles
  FOR ALL USING (
    client_id IN (
      SELECT id FROM clients WHERE tenant_id = get_user_tenant_id()
    ) OR is_super_admin()
  );

-- JOBS TABLE POLICIES
CREATE POLICY "Users can view jobs in their tenant" ON jobs
  FOR SELECT USING (tenant_id = get_user_tenant_id() OR is_super_admin());

CREATE POLICY "Users can manage jobs in their tenant" ON jobs
  FOR ALL USING (
    tenant_id = get_user_tenant_id() OR is_super_admin()
  );

-- JOB_STATUSES TABLE POLICIES (Global reference data)
CREATE POLICY "Anyone can view job statuses" ON job_statuses
  FOR SELECT USING (true);

CREATE POLICY "Super admins can manage job statuses" ON job_statuses
  FOR ALL USING (is_super_admin());

-- QUOTES TABLE POLICIES
CREATE POLICY "Users can view quotes in their tenant" ON quotes
  FOR SELECT USING (
    job_id IN (
      SELECT id FROM jobs WHERE tenant_id = get_user_tenant_id()
    ) OR is_super_admin()
  );

CREATE POLICY "Users can manage quotes in their tenant" ON quotes
  FOR ALL USING (
    job_id IN (
      SELECT id FROM jobs WHERE tenant_id = get_user_tenant_id()
    ) OR is_super_admin()
  );

-- QUOTE_ITEMS TABLE POLICIES
CREATE POLICY "Users can view quote items in their tenant" ON quote_items
  FOR SELECT USING (
    quote_id IN (
      SELECT q.id FROM quotes q
      JOIN jobs j ON q.job_id = j.id
      WHERE j.tenant_id = get_user_tenant_id()
    ) OR is_super_admin()
  );

CREATE POLICY "Users can manage quote items in their tenant" ON quote_items
  FOR ALL USING (
    quote_id IN (
      SELECT q.id FROM quotes q
      JOIN jobs j ON q.job_id = j.id
      WHERE j.tenant_id = get_user_tenant_id()
    ) OR is_super_admin()
  );

-- INVOICES TABLE POLICIES
CREATE POLICY "Users can view invoices in their tenant" ON invoices
  FOR SELECT USING (
    job_id IN (
      SELECT id FROM jobs WHERE tenant_id = get_user_tenant_id()
    ) OR is_super_admin()
  );

CREATE POLICY "Users can manage invoices in their tenant" ON invoices
  FOR ALL USING (
    job_id IN (
      SELECT id FROM jobs WHERE tenant_id = get_user_tenant_id()
    ) OR is_super_admin()
  );

-- INVOICE_ITEMS TABLE POLICIES
CREATE POLICY "Users can view invoice items in their tenant" ON invoice_items
  FOR SELECT USING (
    invoice_id IN (
      SELECT i.id FROM invoices i
      JOIN jobs j ON i.job_id = j.id
      WHERE j.tenant_id = get_user_tenant_id()
    ) OR is_super_admin()
  );

CREATE POLICY "Users can manage invoice items in their tenant" ON invoice_items
  FOR ALL USING (
    invoice_id IN (
      SELECT i.id FROM invoices i
      JOIN jobs j ON i.job_id = j.id
      WHERE j.tenant_id = get_user_tenant_id()
    ) OR is_super_admin()
  );

-- PARTS TABLE POLICIES
CREATE POLICY "Users can view parts in their tenant" ON parts
  FOR SELECT USING (tenant_id = get_user_tenant_id() OR is_super_admin());

CREATE POLICY "Users can manage parts in their tenant" ON parts
  FOR ALL USING (
    tenant_id = get_user_tenant_id() OR is_super_admin()
  );

-- PART_CATEGORIES TABLE POLICIES (Global reference data)
CREATE POLICY "Anyone can view part categories" ON part_categories
  FOR SELECT USING (true);

CREATE POLICY "Super admins can manage part categories" ON part_categories
  FOR ALL USING (is_super_admin());

-- PURCHASE_REQUESTS TABLE POLICIES
CREATE POLICY "Users can view purchase requests in their tenant" ON purchase_requests
  FOR SELECT USING (tenant_id = get_user_tenant_id() OR is_super_admin());

CREATE POLICY "Users can manage purchase requests in their tenant" ON purchase_requests
  FOR ALL USING (
    tenant_id = get_user_tenant_id() OR is_super_admin()
  );

-- PURCHASE_REQUEST_ITEMS TABLE POLICIES
CREATE POLICY "Users can view purchase request items in their tenant" ON purchase_request_items
  FOR SELECT USING (
    purchase_request_id IN (
      SELECT id FROM purchase_requests WHERE tenant_id = get_user_tenant_id()
    ) OR is_super_admin()
  );

CREATE POLICY "Users can manage purchase request items in their tenant" ON purchase_request_items
  FOR ALL USING (
    purchase_request_id IN (
      SELECT id FROM purchase_requests WHERE tenant_id = get_user_tenant_id()
    ) OR is_super_admin()
  );

-- CALENDAR_EVENTS TABLE POLICIES
CREATE POLICY "Users can view calendar events in their tenant" ON calendar_events
  FOR SELECT USING (tenant_id = get_user_tenant_id() OR is_super_admin());

CREATE POLICY "Users can manage calendar events in their tenant" ON calendar_events
  FOR ALL USING (
    tenant_id = get_user_tenant_id() OR is_super_admin()
  );

-- ACTIVITY_LOGS TABLE POLICIES
CREATE POLICY "Users can view activity logs in their tenant" ON activity_logs
  FOR SELECT USING (tenant_id = get_user_tenant_id() OR is_super_admin());

CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- SYSTEM_CONFIG TABLE POLICIES
CREATE POLICY "Users can view system config for their tenant" ON system_config
  FOR SELECT USING (tenant_id = get_user_tenant_id() OR is_super_admin());

CREATE POLICY "Admins can manage system config for their tenant" ON system_config
  FOR ALL USING (
    (tenant_id = get_user_tenant_id() AND has_role('admin')) OR 
    is_super_admin()
  );

-- SUBSCRIPTION_TIERS TABLE POLICIES (Global reference data)
CREATE POLICY "Anyone can view subscription tiers" ON subscription_tiers
  FOR SELECT USING (true);

CREATE POLICY "Super admins can manage subscription tiers" ON subscription_tiers
  FOR ALL USING (is_super_admin());

-- ROLES TABLE POLICIES (Global reference data)
CREATE POLICY "Anyone can view roles" ON roles
  FOR SELECT USING (true);

CREATE POLICY "Super admins can manage roles" ON roles
  FOR ALL USING (is_super_admin());

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
