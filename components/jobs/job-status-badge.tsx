import { Badge } from "@/components/ui/badge"

interface JobStatusBadgeProps {
  status: {
    name: string
    color: string
  }
  size?: "sm" | "default" | "lg"
}

export default function JobStatusBadge({ status, size = "default" }: JobStatusBadgeProps) {
  return (
    <Badge
      style={{
        backgroundColor: status.color,
        color: "white",
        borderColor: status.color,
      }}
      variant="secondary"
      className={size === "sm" ? "text-xs px-2 py-1" : size === "lg" ? "text-sm px-3 py-1" : ""}
    >
      {status.name}
    </Badge>
  )
}
