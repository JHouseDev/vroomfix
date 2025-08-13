"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Package } from "lucide-react"
import { allocatePartsToJob, recordPartsUsage } from "@/lib/inventory/job-integration"
import { toast } from "sonner"

interface PartsUsageFormProps {
  jobId: string
  allocatedParts: any[]
  availableParts: any[]
}

export default function PartsUsageForm({ jobId, allocatedParts, availableParts }: PartsUsageFormProps) {
  const [selectedPart, setSelectedPart] = useState("")
  const [allocationQuantity, setAllocationQuantity] = useState(1)
  const [usageData, setUsageData] = useState<Record<string, { quantity: number; notes: string }>>({})
  const [isAllocating, setIsAllocating] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  const handleAllocatePart = async () => {
    if (!selectedPart || allocationQuantity <= 0) {
      toast.error("Please select a part and valid quantity")
      return
    }

    setIsAllocating(true)
    try {
      const result = await allocatePartsToJob(jobId, [{ partId: selectedPart, quantity: allocationQuantity }])

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Part allocated successfully")
        setSelectedPart("")
        setAllocationQuantity(1)
        window.location.reload() // Refresh to show updated allocations
      }
    } catch (error) {
      toast.error("Failed to allocate part")
    } finally {
      setIsAllocating(false)
    }
  }

  const handleRecordUsage = async () => {
    const partsToRecord = Object.entries(usageData)
      .filter(([_, data]) => data.quantity > 0)
      .map(([partId, data]) => ({
        partId,
        quantityUsed: data.quantity,
        notes: data.notes,
      }))

    if (partsToRecord.length === 0) {
      toast.error("Please specify usage quantities")
      return
    }

    setIsRecording(true)
    try {
      const result = await recordPartsUsage(jobId, partsToRecord)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Parts usage recorded successfully")
        setUsageData({})
        window.location.reload() // Refresh to show updated usage
      }
    } catch (error) {
      toast.error("Failed to record parts usage")
    } finally {
      setIsRecording(false)
    }
  }

  const updateUsageData = (partId: string, field: "quantity" | "notes", value: number | string) => {
    setUsageData((prev) => ({
      ...prev,
      [partId]: {
        ...prev[partId],
        [field]: value,
      },
    }))
  }

  return (
    <div className="space-y-6">
      {/* Allocate New Parts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Allocate Parts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="part-select">Select Part</Label>
              <Select value={selectedPart} onValueChange={setSelectedPart}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a part..." />
                </SelectTrigger>
                <SelectContent>
                  {availableParts.map((part) => (
                    <SelectItem key={part.id} value={part.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {part.name} ({part.part_number})
                        </span>
                        <Badge variant="outline" className="ml-2">
                          Stock: {part.current_stock}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={allocationQuantity}
                onChange={(e) => setAllocationQuantity(Number.parseInt(e.target.value))}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleAllocatePart} disabled={isAllocating || !selectedPart} className="w-full">
                {isAllocating ? "Allocating..." : "Allocate Part"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Record Parts Usage */}
      {allocatedParts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Record Parts Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {allocatedParts.map((allocation: any) => (
              <div key={allocation.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{allocation.part.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {allocation.part.part_number} • Allocated: {allocation.quantity_allocated}
                    </p>
                    {allocation.quantity_used && (
                      <p className="text-sm text-green-600">Already used: {allocation.quantity_used}</p>
                    )}
                  </div>
                  <Badge variant="outline">{allocation.part.condition}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`usage-${allocation.id}`}>Quantity Used</Label>
                    <Input
                      id={`usage-${allocation.id}`}
                      type="number"
                      min="0"
                      max={allocation.quantity_allocated - (allocation.quantity_used || 0)}
                      value={usageData[allocation.part_id]?.quantity || 0}
                      onChange={(e) => updateUsageData(allocation.part_id, "quantity", Number.parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`notes-${allocation.id}`}>Usage Notes</Label>
                    <Textarea
                      id={`notes-${allocation.id}`}
                      placeholder="Optional notes about usage..."
                      value={usageData[allocation.part_id]?.notes || ""}
                      onChange={(e) => updateUsageData(allocation.part_id, "notes", e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button onClick={handleRecordUsage} disabled={isRecording} className="w-full">
              {isRecording ? "Recording Usage..." : "Record Parts Usage"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
