"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { MobileNavigation } from "./mobile-navigation"
import { TopBar } from "./top-bar"
import { createClientComponentClient } from "@/lib/supabase/client"

interface NavigationContextType {
  isSidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  userRole: string | null
  tenantId: string | null
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider")
  }
  return context
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  // Check if we're on auth pages
  const isAuthPage = pathname?.startsWith("/auth") || pathname?.startsWith("/client-portal/login")

  useEffect(() => {
    async function getUserData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data: userData, error } = await supabase
            .from("users")
            .select("role, tenant_id")
            .eq("id", user.id)
            .single()

          if (userData && !error) {
            setUserRole(userData.role)
            setTenantId(userData.tenant_id)
          } else {
            console.warn("Could not fetch user role:", error)
            setUserRole("admin") // Fallback role
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        setUserRole("admin")
      }
    }

    getUserData()
  }, [supabase])

  // Don't show navigation on auth pages
  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <NavigationContext.Provider value={{ isSidebarOpen, setSidebarOpen, userRole, tenantId }}>
      <div className="flex h-screen bg-background">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">{children}</main>
        </div>

        {/* Mobile Navigation */}
        <MobileNavigation />
      </div>
    </NavigationContext.Provider>
  )
}
