// Permission constants
export const PERMISSIONS = {
  // System permissions
  ALL: "all",

  // Tenant management
  TENANT_MANAGEMENT: "tenant_management",
  USER_MANAGEMENT: "user_management",
  SETTINGS: "settings",

  // Job management
  JOB_MANAGEMENT: "job_management",
  JOB_VIEW: "job_view",
  JOB_UPDATE: "job_update",
  JOB_APPROVAL: "job_approval",

  // Financial
  FINANCIAL_MANAGEMENT: "financial_management",
  FINANCIAL_VIEW: "financial_view",
  INVOICING: "invoicing",
  QUOTES: "quotes",

  // Client management
  CLIENT_MANAGEMENT: "client_management",
  CLIENT_PORTAL: "client_portal",
  JOB_VIEW_OWN: "job_view_own",
  QUOTE_APPROVAL: "quote_approval",

  // Inventory
  INVENTORY_MANAGEMENT: "inventory_management",
  PARTS_USAGE: "parts_usage",

  // Reporting
  REPORTING: "reporting",
  BASIC_REPORTING: "basic_reporting",
  ADVANCED_REPORTING: "advanced_reporting",

  // Time tracking
  TIME_TRACKING: "time_tracking",

  // User view
  USER_VIEW: "user_view",
} as const

// Role-based permission sets
export const ROLE_PERMISSIONS = {
  super_admin: {
    [PERMISSIONS.ALL]: true,
  },
  admin: {
    [PERMISSIONS.TENANT_MANAGEMENT]: true,
    [PERMISSIONS.USER_MANAGEMENT]: true,
    [PERMISSIONS.JOB_MANAGEMENT]: true,
    [PERMISSIONS.FINANCIAL_MANAGEMENT]: true,
    [PERMISSIONS.CLIENT_MANAGEMENT]: true,
    [PERMISSIONS.INVENTORY_MANAGEMENT]: true,
    [PERMISSIONS.REPORTING]: true,
    [PERMISSIONS.SETTINGS]: true,
  },
  manager: {
    [PERMISSIONS.JOB_MANAGEMENT]: true,
    [PERMISSIONS.JOB_APPROVAL]: true,
    [PERMISSIONS.FINANCIAL_VIEW]: true,
    [PERMISSIONS.CLIENT_MANAGEMENT]: true,
    [PERMISSIONS.REPORTING]: true,
    [PERMISSIONS.USER_VIEW]: true,
  },
  accounts: {
    [PERMISSIONS.FINANCIAL_MANAGEMENT]: true,
    [PERMISSIONS.INVOICING]: true,
    [PERMISSIONS.QUOTES]: true,
    [PERMISSIONS.CLIENT_MANAGEMENT]: true,
    [PERMISSIONS.REPORTING]: true,
  },
  technician: {
    [PERMISSIONS.JOB_VIEW]: true,
    [PERMISSIONS.JOB_UPDATE]: true,
    [PERMISSIONS.TIME_TRACKING]: true,
    [PERMISSIONS.PARTS_USAGE]: true,
  },
  client: {
    [PERMISSIONS.CLIENT_PORTAL]: true,
    [PERMISSIONS.JOB_VIEW_OWN]: true,
    [PERMISSIONS.QUOTE_APPROVAL]: true,
  },
} as const

// Helper functions
export const hasPermission = (userRole: any, permission: string): boolean => {
  if (!userRole || !userRole.permissions) return false

  // Super admin has all permissions
  if (userRole.permissions[PERMISSIONS.ALL] === true) return true

  // Check specific permission
  return userRole.permissions[permission] === true
}

export const hasAnyPermission = (userRole: any, permissions: string[]): boolean => {
  return permissions.some((permission) => hasPermission(userRole, permission))
}

export const canAccessRoute = (userRole: any, route: string): boolean => {
  // Define route permission mappings
  const routePermissions: Record<string, string[]> = {
    "/dashboard": [PERMISSIONS.JOB_VIEW, PERMISSIONS.CLIENT_PORTAL],
    "/jobs": [PERMISSIONS.JOB_MANAGEMENT, PERMISSIONS.JOB_VIEW],
    "/quotes": [PERMISSIONS.QUOTES, PERMISSIONS.FINANCIAL_VIEW],
    "/invoices": [PERMISSIONS.INVOICING, PERMISSIONS.FINANCIAL_VIEW],
    "/clients": [PERMISSIONS.CLIENT_MANAGEMENT],
    "/inventory": [PERMISSIONS.INVENTORY_MANAGEMENT],
    "/reports": [PERMISSIONS.REPORTING, PERMISSIONS.BASIC_REPORTING],
    "/admin": [PERMISSIONS.TENANT_MANAGEMENT, PERMISSIONS.USER_MANAGEMENT],
    "/super-admin": [PERMISSIONS.ALL],
  }

  const requiredPermissions = routePermissions[route]
  if (!requiredPermissions) return true // Public route

  return hasAnyPermission(userRole, requiredPermissions)
}
