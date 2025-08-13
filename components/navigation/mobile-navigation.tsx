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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <div className="flex items-center justify-around py-2">
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
              pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <item.icon className={cn("w-5 h-5", pathname === item.href ? "text-primary" : "text-muted-foreground")} />
            <span className="truncate max-w-[60px]">{item.title}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
