"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useNavigation } from "./navigation-provider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Receipt,
  Package,
  BarChart3,
  Users,
  Calendar,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
  children?: NavItem[]
}

const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "admin", "manager", "accounts", "technician"],
  },
  {
    title: "Jobs",
    href: "/jobs",
    icon: Briefcase,
    roles: ["super_admin", "admin", "manager", "accounts", "technician"],
    children: [
      {
        title: "All Jobs",
        href: "/jobs",
        icon: Briefcase,
        roles: ["super_admin", "admin", "manager", "accounts", "technician"],
      },
      {
        title: "Create Job",
        href: "/jobs/new",
        icon: Briefcase,
        roles: ["super_admin", "admin", "manager", "accounts"],
      },
      {
        title: "Calendar",
        href: "/calendar",
        icon: Calendar,
        roles: ["super_admin", "admin", "manager", "accounts", "technician"],
      },
    ],
  },
  {
    title: "Quotes",
    href: "/quotes",
    icon: FileText,
    roles: ["super_admin", "admin", "manager", "accounts"],
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: Receipt,
    roles: ["super_admin", "admin", "manager", "accounts"],
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Package,
    roles: ["super_admin", "admin", "manager", "accounts", "technician"],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["super_admin", "admin", "manager", "accounts"],
  },
  {
    title: "Clients",
    href: "/clients",
    icon: Users,
    roles: ["super_admin", "admin", "manager", "accounts"],
  },
  {
    title: "Super Admin",
    href: "/super-admin",
    icon: Settings,
    roles: ["super_admin"],
  },
]

export function Sidebar() {
  const { isSidebarOpen, setSidebarOpen, userRole } = useNavigation()
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]))
  }

  const filteredItems = navigationItems.filter((item) => userRole && item.roles.includes(userRole))

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:flex md:flex-col md:w-64 bg-sidebar border-r border-sidebar-border transition-all duration-300",
          isSidebarOpen ? "md:w-64" : "md:w-16",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <div className={cn("flex items-center gap-2", !isSidebarOpen && "justify-center")}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary-foreground" />
            </div>
            {isSidebarOpen && (
              <div>
                <h1 className="font-serif font-bold text-lg text-sidebar-foreground">FleetPro</h1>
                <p className="text-xs text-muted-foreground">Fleet Management</p>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!isSidebarOpen)} className="hidden md:flex">
            <Menu className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-2">
          <nav className="space-y-1">
            {filteredItems.map((item) => (
              <div key={item.title}>
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex-1",
                      pathname === item.href
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground",
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {isSidebarOpen && <span>{item.title}</span>}
                  </Link>
                  {item.children && isSidebarOpen && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(item.title)}
                      className="p-1 h-8 w-8"
                    >
                      {expandedItems.includes(item.title) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>

                {item.children && isSidebarOpen && expandedItems.includes(item.title) && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children
                      .filter((child) => userRole && child.roles.includes(userRole))
                      .map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            pathname === child.href
                              ? "bg-sidebar-primary text-sidebar-primary-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          <child.icon className="w-4 h-4" />
                          <span>{child.title}</span>
                        </Link>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </ScrollArea>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <div
            className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-serif font-bold text-lg text-sidebar-foreground">FleetPro</h1>
                  <p className="text-xs text-muted-foreground">Fleet Management</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-2">
              <nav className="space-y-1">
                {filteredItems.map((item) => (
                  <div key={item.title}>
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex-1",
                          pathname === item.href
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground",
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                      {item.children && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(item.title)}
                          className="p-1 h-8 w-8"
                        >
                          {expandedItems.includes(item.title) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>

                    {item.children && expandedItems.includes(item.title) && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.children
                          .filter((child) => userRole && child.roles.includes(userRole))
                          .map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setSidebarOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                pathname === child.href
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              <child.icon className="w-4 h-4" />
                              <span>{child.title}</span>
                            </Link>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </ScrollArea>
          </div>
        </div>
      )}
    </>
  )
}
