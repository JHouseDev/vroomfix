"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useNavigation } from "./navigation-provider"
import { LayoutDashboard, Briefcase, FileText, Receipt, Package } from "lucide-react"

const mobileNavItems = [
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
]

export function MobileNavigation() {
  const { userRole } = useNavigation()
  const pathname = usePathname()

  const filteredItems = mobileNavItems.filter((item) => userRole && item.roles.includes(userRole))

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-40 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-3">
        {filteredItems.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 min-w-0 flex-1",
              pathname === item.href
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
          >
            <item.icon
              className={cn(
                "w-5 h-5 transition-colors",
                pathname === item.href ? "text-primary" : "text-muted-foreground",
              )}
            />
            <span className="truncate text-center leading-tight max-w-[50px]">{item.title}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
