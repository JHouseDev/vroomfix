-- Fleet Service Management System Database Schema
-- Multi-tenant architecture with role-based access control

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CORE MULTI-TENANT TABLES
-- =============================================

-- Subscription tiers for tenants
CREATE TABLE subscription_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  max_users INTEGER NOT NULL DEFAULT 5,
  max_clients INTEGER NOT NULL DEFAULT 50,
  max_jobs_per_month INTEGER NOT NULL DEFAULT 100,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenants (repair shops/mechanics)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'South Africa',
  subscription_tier_id UUID REFERENCES subscription_tiers(id),
  subscription_status VARCHAR(50) DEFAULT 'active',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- White-labeling settings
  branding JSONB DEFAULT '{}', -- logo_url, primary_color, secondary_color, etc.
  settings JSONB DEFAULT '{}', -- modular feature toggles
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles and permissions
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  is_system_role BOOLEAN DEFAULT false, -- for super_admin role
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users (multi-tenant with role-based access)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  avatar_url TEXT,
  
  -- User preferences and settings
  preferences JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CLIENT AND VEHICLE MANAGEMENT
-- =============================================

-- Clients (customers of the repair shop)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Client details
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  
  -- Client portal access
  portal_access BOOLEAN DEFAULT false,
  portal_password_hash VARCHAR(255),
  
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles/Fleet items
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Vehicle identification
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER,
  vin VARCHAR(50),
  license_plate VARCHAR(20),
  color VARCHAR(50),
  
  -- Vehicle details
  engine_type VARCHAR(100),
  transmission VARCHAR(50),
  fuel_type VARCHAR(50),
  mileage INTEGER,
  
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INVENTORY MANAGEMENT
-- =============================================

-- Parts categories
CREATE TABLE part_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES part_categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parts inventory
CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES part_categories(id),
  
  -- Part details
  part_number VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  brand VARCHAR(100),
  
  -- Inventory tracking
  quantity_in_stock INTEGER DEFAULT 0,
  minimum_stock_level INTEGER DEFAULT 0,
  
  -- Pricing
  cost_price DECIMAL(10,2) DEFAULT 0,
  selling_price DECIMAL(10,2) DEFAULT 0,
  markup_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Part condition
  condition VARCHAR(50) DEFAULT 'new', -- new, used, refurbished
  
  -- Supplier information
  supplier_name VARCHAR(255),
  supplier_part_number VARCHAR(100),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- JOB MANAGEMENT WORKFLOW
-- =============================================

-- Job statuses for workflow tracking
CREATE TABLE job_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  color VARCHAR(7) DEFAULT '#6B7280', -- hex color for UI
  is_system_status BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs (main workflow entity)
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  vehicle_id UUID REFERENCES vehicles(id),
  assigned_technician_id UUID REFERENCES users(id),
  status_id UUID REFERENCES job_statuses(id),
  
  -- Job identification
  job_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Job details
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  
  -- Scheduling
  scheduled_start_date TIMESTAMP WITH TIME ZONE,
  scheduled_end_date TIMESTAMP WITH TIME ZONE,
  actual_start_date TIMESTAMP WITH TIME ZONE,
  actual_end_date TIMESTAMP WITH TIME ZONE,
  
  -- Financial tracking
  estimated_cost DECIMAL(10,2) DEFAULT 0,
  actual_cost DECIMAL(10,2) DEFAULT 0,
  
  -- Workflow tracking
  quote_required BOOLEAN DEFAULT true,
  quote_approved BOOLEAN DEFAULT false,
  quote_approved_at TIMESTAMP WITH TIME ZONE,
  quote_approved_by UUID REFERENCES users(id),
  
  work_authorized BOOLEAN DEFAULT false,
  work_authorized_at TIMESTAMP WITH TIME ZONE,
  work_authorized_by UUID REFERENCES users(id),
  
  manager_signoff_required BOOLEAN DEFAULT false,
  manager_signoff BOOLEAN DEFAULT false,
  manager_signoff_at TIMESTAMP WITH TIME ZONE,
  manager_signoff_by UUID REFERENCES users(id),
  
  vehicle_collected BOOLEAN DEFAULT false,
  vehicle_collected_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional data
  internal_notes TEXT,
  client_notes TEXT,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- QUOTING SYSTEM
-- =============================================

-- Quotes
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  
  -- Quote details
  quote_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Financial
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Status and approval
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, approved, rejected, expired
  valid_until DATE,
  
  -- Client approval
  client_approved BOOLEAN DEFAULT false,
  client_approved_at TIMESTAMP WITH TIME ZONE,
  client_signature TEXT, -- base64 encoded signature
  client_ip_address INET,
  
  -- Terms and conditions
  terms_and_conditions TEXT,
  notes TEXT,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quote line items
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts(id),
  
  -- Item details
  item_type VARCHAR(50) NOT NULL, -- labor, part, service
  description TEXT NOT NULL,
  
  -- Quantities and pricing
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Labor specific
  hours DECIMAL(5,2),
  hourly_rate DECIMAL(10,2),
  
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INVOICING SYSTEM
-- =============================================

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id),
  quote_id UUID REFERENCES quotes(id),
  client_id UUID REFERENCES clients(id),
  
  -- Invoice details
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  
  -- Financial
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  amount_due DECIMAL(10,2) DEFAULT 0,
  
  -- Status and dates
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  
  -- Payment tracking
  payment_method VARCHAR(100),
  payment_reference VARCHAR(255),
  
  -- Terms and notes
  terms_and_conditions TEXT,
  notes TEXT,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice line items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts(id),
  
  -- Item details
  item_type VARCHAR(50) NOT NULL, -- labor, part, service
  description TEXT NOT NULL,
  
  -- Quantities and pricing
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Labor specific
  hours DECIMAL(5,2),
  hourly_rate DECIMAL(10,2),
  
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PURCHASE MANAGEMENT
-- =============================================

-- Purchase requests
CREATE TABLE purchase_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id),
  
  -- Request details
  request_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Status and approval
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, ordered, received, cancelled
  priority VARCHAR(20) DEFAULT 'medium',
  
  -- Financial
  estimated_total DECIMAL(10,2) DEFAULT 0,
  actual_total DECIMAL(10,2) DEFAULT 0,
  
  -- Approval workflow
  requires_approval BOOLEAN DEFAULT true,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Supplier information
  supplier_name VARCHAR(255),
  supplier_contact TEXT,
  
  requested_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase request items
CREATE TABLE purchase_request_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_request_id UUID REFERENCES purchase_requests(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts(id),
  
  -- Item details
  description TEXT NOT NULL,
  part_number VARCHAR(100),
  
  -- Quantities and pricing
  quantity_requested INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  estimated_unit_price DECIMAL(10,2),
  actual_unit_price DECIMAL(10,2),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, ordered, received, cancelled
  
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SCHEDULING AND CALENDAR
-- =============================================

-- Calendar events for job scheduling
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id),
  assigned_user_id UUID REFERENCES users(id),
  
  -- Event details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Scheduling
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  
  -- Event type and status
  event_type VARCHAR(50) DEFAULT 'job', -- job, appointment, maintenance, etc.
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  
  -- Recurrence (for recurring maintenance)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- AUDIT AND ACTIVITY TRACKING
-- =============================================

-- Activity log for audit trail
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  -- Activity details
  entity_type VARCHAR(100) NOT NULL, -- job, quote, invoice, etc.
  entity_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL, -- created, updated, deleted, approved, etc.
  
  -- Change tracking
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Multi-tenant indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX idx_vehicles_tenant_id ON vehicles(tenant_id);
CREATE INDEX idx_jobs_tenant_id ON jobs(tenant_id);
CREATE INDEX idx_quotes_tenant_id ON quotes(tenant_id);
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_parts_tenant_id ON parts(tenant_id);

-- Workflow indexes
CREATE INDEX idx_jobs_status_id ON jobs(status_id);
CREATE INDEX idx_jobs_assigned_technician ON jobs(assigned_technician_id);
CREATE INDEX idx_jobs_client_id ON jobs(client_id);
CREATE INDEX idx_jobs_vehicle_id ON jobs(vehicle_id);

-- Financial indexes
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_quotes_status ON quotes(status);

-- Calendar indexes
CREATE INDEX idx_calendar_events_tenant_id ON calendar_events(tenant_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_assigned_user ON calendar_events(assigned_user_id);

-- Activity log indexes
CREATE INDEX idx_activity_logs_tenant_id ON activity_logs(tenant_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
