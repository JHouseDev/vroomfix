"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useNavigation } from "./navigation-provider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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

  const filteredItems = userRole ? navigationItems.filter((item) => item.roles.includes(userRole)) : navigationItems // Show all items if no role is set yet

  const NavItemComponent = ({ item, isChild = false }: { item: NavItem; isChild?: boolean }) => {
    const content = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isChild ? "px-3 py-2" : "px-3 py-3",
          !isSidebarOpen && !isChild && "justify-center px-2",
          pathname === item.href
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : isChild
              ? "text-muted-foreground"
              : "text-sidebar-foreground",
          "flex-1 min-w-0",
        )}
      >
        <item.icon className={cn("flex-shrink-0", isChild ? "w-4 h-4" : "w-5 h-5")} />
        {(isSidebarOpen || isChild) && <span className="truncate">{item.title}</span>}
      </Link>
    )

    if (!isSidebarOpen && !isChild) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      )
    }

    return content
  }

  return (
    <TooltipProvider>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:flex md:flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 h-full relative",
          isSidebarOpen ? "md:w-64" : "md:w-16",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border min-h-[73px] relative">
          <div className={cn("flex items-center gap-3", !isSidebarOpen && "justify-center w-full")}>
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-6 h-6 text-primary-foreground" />
            </div>
            {isSidebarOpen && (
              <div className="min-w-0">
                <h1 className="font-serif font-bold text-lg text-sidebar-foreground truncate">FleetPro</h1>
                <p className="text-xs text-muted-foreground truncate">Fleet Management</p>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className={cn(
              "flex-shrink-0 h-8 w-8 p-0 z-10",
              isSidebarOpen
                ? "relative"
                : "absolute -right-3 top-1/2 -translate-y-1/2 bg-sidebar border border-sidebar-border shadow-md hover:bg-sidebar-accent",
            )}
          >
            {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className={cn("space-y-2", !isSidebarOpen && "space-y-1")}>
            {filteredItems.map((item) => (
              <div key={item.title}>
                <div className="flex items-center">
                  <NavItemComponent item={item} />
                  {item.children && isSidebarOpen && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(item.title)}
                      className="p-1 h-8 w-8 flex-shrink-0 ml-1"
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
                  <div className="ml-8 mt-2 space-y-1">
                    {item.children
                      .filter((child) => !userRole || child.roles.includes(userRole))
                      .map((child) => (
                        <NavItemComponent key={child.href} item={child} isChild />
                      ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {!userRole && (
          <div className="p-2 text-xs text-muted-foreground border-t border-sidebar-border">Role: Loading...</div>
        )}
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <div
            className="fixed left-0 top-0 h-full w-80 bg-sidebar border-r border-sidebar-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-serif font-bold text-lg text-sidebar-foreground">FleetPro</h1>
                  <p className="text-xs text-muted-foreground">Fleet Management</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 px-3 py-4">
              <nav className="space-y-2">
                {filteredItems.map((item) => (
                  <div key={item.title}>
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex-1",
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
                          className="p-1 h-8 w-8 ml-1"
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
                      <div className="ml-8 mt-2 space-y-1">
                        {item.children
                          .filter((child) => !userRole || child.roles.includes(userRole))
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
                              <child.icon className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{child.title}</span>
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
    </TooltipProvider>
  )
}
