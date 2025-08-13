"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Package, AlertTriangle, Plus, Edit } from "lucide-react"
import Link from "next/link"

interface Part {
  id: string
  part_number: string
  name: string
  description: string | null
  category: string
  condition: "new" | "used" | "refurbished"
  cost_price: number
  selling_price: number
  current_stock: number
  minimum_stock: number
  location: string | null
  supplier?: {
    name: string
  }
}

interface PartsListProps {
  parts: Part[]
}

export function PartsList({ parts }: PartsListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [conditionFilter, setConditionFilter] = useState("all")

  const filteredParts = parts.filter((part) => {
    const matchesSearch =
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.part_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || part.category === categoryFilter
    const matchesCondition = conditionFilter === "all" || part.condition === conditionFilter

    return matchesSearch && matchesCategory && matchesCondition
  })

  const categories = [...new Set(parts.map((part) => part.category))]
  const lowStockParts = parts.filter((part) => part.current_stock <= part.minimum_stock)

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "new":
        return "bg-green-100 text-green-800"
      case "used":
        return "bg-yellow-100 text-yellow-800"
      case "refurbished":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parts Inventory</h1>
          <p className="text-gray-600">Manage your parts and stock levels</p>
        </div>
        <Link href="/inventory/parts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Part
          </Button>
        </Link>
      </div>

      {/* Low Stock Alert */}
      {lowStockParts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-orange-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-2">
              {lowStockParts.length} part{lowStockParts.length !== 1 ? "s" : ""} running low on stock
            </p>
            <div className="flex flex-wrap gap-2">
              {lowStockParts.slice(0, 5).map((part) => (
                <Badge key={part.id} variant="outline" className="text-orange-700 border-orange-300">
                  {part.name} ({part.current_stock} left)
                </Badge>
              ))}
              {lowStockParts.length > 5 && (
                <Badge variant="outline" className="text-orange-700 border-orange-300">
                  +{lowStockParts.length - 5} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search parts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Conditions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="refurbished">Refurbished</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Parts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredParts.map((part) => (
          <Card key={part.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{part.name}</CardTitle>
                </div>
                <Link href={`/inventory/parts/${part.id}/edit`}>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-gray-600">{part.part_number}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <Badge className={getConditionColor(part.condition)}>{part.condition}</Badge>
                <Badge variant="outline">{part.category}</Badge>
              </div>

              {part.description && <p className="text-sm text-gray-600 line-clamp-2">{part.description}</p>}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Cost Price</p>
                  <p className="font-medium">${part.cost_price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Selling Price</p>
                  <p className="font-medium">${part.selling_price.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <div>
                  <p className="text-sm text-gray-500">Stock Level</p>
                  <p
                    className={`font-medium ${part.current_stock <= part.minimum_stock ? "text-orange-600" : "text-green-600"}`}
                  >
                    {part.current_stock} units
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Min Stock</p>
                  <p className="font-medium">{part.minimum_stock}</p>
                </div>
              </div>

              {part.location && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Location:</span> {part.location}
                </p>
              )}

              {part.supplier && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Supplier:</span> {part.supplier.name}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredParts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No parts found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || categoryFilter !== "all" || conditionFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first part to inventory"}
            </p>
            {!searchTerm && categoryFilter === "all" && conditionFilter === "all" && (
              <Link href="/inventory/parts/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Part
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
