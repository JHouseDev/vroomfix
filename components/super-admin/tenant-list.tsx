"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Settings, BarChart3, Users, Building } from "lucide-react"
import Link from "next/link"

interface Tenant {
  id: string
  name: string
  subdomain: string
  subscription_tier: string
  status: string
  created_at: string
  user_count?: number
  job_count?: number
  revenue?: number
}

interface TenantListProps {
  tenants: Tenant[]
}

export function TenantList({ tenants }: TenantListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tierFilter, setTierFilter] = useState("all")

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter
    const matchesTier = tierFilter === "all" || tenant.subscription_tier === tierFilter

    return matchesSearch && matchesStatus && matchesTier
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      case "trial":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "enterprise":
        return "bg-purple-100 text-purple-800"
      case "professional":
        return "bg-blue-100 text-blue-800"
      case "basic":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-600">Manage all tenants and their subscriptions</p>
        </div>
        <Link href="/super-admin/tenants/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Tenant
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTenants.map((tenant) => (
          <Card key={tenant.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{tenant.name}</CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Link href={`/super-admin/tenants/${tenant.id}/analytics`}>
                    <Button variant="ghost" size="sm">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/super-admin/tenants/${tenant.id}`}>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <p className="text-sm text-gray-600">{tenant.subdomain}.yourdomain.com</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge className={getStatusColor(tenant.status)}>{tenant.status}</Badge>
                <Badge className={getTierColor(tenant.subscription_tier)}>{tenant.subscription_tier}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="h-4 w-4 text-gray-500" />
                  </div>
                  <p className="font-medium">{tenant.user_count || 0}</p>
                  <p className="text-gray-500 text-xs">Users</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <BarChart3 className="h-4 w-4 text-gray-500" />
                  </div>
                  <p className="font-medium">{tenant.job_count || 0}</p>
                  <p className="text-gray-500 text-xs">Jobs</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <span className="text-gray-500 text-sm">$</span>
                  </div>
                  <p className="font-medium">{formatCurrency(tenant.revenue || 0)}</p>
                  <p className="text-gray-500 text-xs">Revenue</p>
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500">Created: {formatDate(tenant.created_at)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTenants.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" || tierFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first tenant"}
            </p>
            {!searchTerm && statusFilter === "all" && tierFilter === "all" && (
              <Link href="/super-admin/tenants/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Tenant
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
