-- Insert default data for the fleet service management system

-- =============================================
-- DEFAULT SUBSCRIPTION TIERS
-- =============================================

INSERT INTO subscription_tiers (id, name, description, max_users, max_clients, max_jobs_per_month, price_monthly, features) VALUES
(uuid_generate_v4(), 'Starter', 'Perfect for small repair shops', 3, 25, 50, 29.99, '{"job_management": true, "basic_reporting": true, "client_portal": false, "inventory_management": false}'),
(uuid_generate_v4(), 'Professional', 'For growing businesses', 10, 100, 200, 79.99, '{"job_management": true, "basic_reporting": true, "advanced_reporting": true, "client_portal": true, "inventory_management": true, "calendar_scheduling": true}'),
(uuid_generate_v4(), 'Enterprise', 'For large operations', 50, 500, 1000, 199.99, '{"job_management": true, "basic_reporting": true, "advanced_reporting": true, "client_portal": true, "inventory_management": true, "calendar_scheduling": true, "api_access": true, "custom_branding": true}');

-- =============================================
-- DEFAULT ROLES
-- =============================================

INSERT INTO roles (id, name, description, permissions, is_system_role) VALUES
(uuid_generate_v4(), 'super_admin', 'System Super Administrator', '{"all": true}', true),
(uuid_generate_v4(), 'admin', 'Tenant Administrator', '{"tenant_management": true, "user_management": true, "job_management": true, "financial_management": true, "reporting": true, "settings": true}', false),
(uuid_generate_v4(), 'manager', 'Shop Manager', '{"job_management": true, "job_approval": true, "financial_view": true, "reporting": true, "user_view": true}', false),
(uuid_generate_v4(), 'accounts', 'Accounts/Finance', '{"financial_management": true, "invoicing": true, "quotes": true, "reporting": true, "client_management": true}', false),
(uuid_generate_v4(), 'technician', 'Technician', '{"job_view": true, "job_update": true, "time_tracking": true, "parts_usage": true}', false),
(uuid_generate_v4(), 'client', 'Client Portal User', '{"client_portal": true, "job_view_own": true, "quote_approval": true}', false);

-- =============================================
-- DEFAULT JOB STATUSES
-- =============================================

INSERT INTO job_statuses (id, name, description, order_index, color, is_system_status) VALUES
(uuid_generate_v4(), 'Request Received', 'Initial job request received', 1, '#6B7280', true),
(uuid_generate_v4(), 'Quote Pending', 'Quote being prepared', 2, '#F59E0B', true),
(uuid_generate_v4(), 'Quote Sent', 'Quote sent to client', 3, '#3B82F6', true),
(uuid_generate_v4(), 'Quote Approved', 'Client approved the quote', 4, '#10B981', true),
(uuid_generate_v4(), 'Work Authorized', 'Work has been authorized', 5, '#8B5CF6', true),
(uuid_generate_v4(), 'Parts Ordered', 'Required parts have been ordered', 6, '#F97316', false),
(uuid_generate_v4(), 'In Progress', 'Work is currently in progress', 7, '#06B6D4', true),
(uuid_generate_v4(), 'Quality Check', 'Work completed, undergoing quality check', 8, '#84CC16', false),
(uuid_generate_v4(), 'Ready for Collection', 'Vehicle ready for client collection', 9, '#22C55E', true),
(uuid_generate_v4(), 'Collected', 'Vehicle collected by client', 10, '#059669', true),
(uuid_generate_v4(), 'Invoiced', 'Invoice generated and sent', 11, '#7C3AED', true),
(uuid_generate_v4(), 'Paid', 'Invoice paid in full', 12, '#16A34A', true),
(uuid_generate_v4(), 'On Hold', 'Job temporarily on hold', 99, '#EF4444', false),
(uuid_generate_v4(), 'Cancelled', 'Job cancelled', 100, '#DC2626', false);

-- =============================================
-- DEFAULT PART CATEGORIES
-- =============================================

-- Note: These will be created per tenant, this is just a template
-- The actual categories will be inserted when tenants are created

-- =============================================
-- SYSTEM CONFIGURATION
-- =============================================

-- Create a system configuration table for global settings
CREATE TABLE IF NOT EXISTS system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO system_config (key, value, description) VALUES
('default_tax_rate', '15.0', 'Default tax rate percentage for South Africa (VAT)'),
('default_currency', '"ZAR"', 'Default currency code'),
('job_number_prefix', '"JOB"', 'Prefix for auto-generated job numbers'),
('quote_number_prefix', '"QTE"', 'Prefix for auto-generated quote numbers'),
('invoice_number_prefix', '"INV"', 'Prefix for auto-generated invoice numbers'),
('purchase_request_prefix', '"PR"', 'Prefix for auto-generated purchase request numbers'),
('default_quote_validity_days', '30', 'Default number of days quotes are valid'),
('default_invoice_due_days', '30', 'Default number of days for invoice payment terms');
