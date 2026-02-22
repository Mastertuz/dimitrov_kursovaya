import { Clock, CheckCircle2, Truck, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getOrderStatusLabel } from "@/lib/utils"

export function OrderStatusIcon({ statusCode }: { statusCode: string }) {
  switch (statusCode) {
    case "APPROVED":
    case "CLOSED":
      return <CheckCircle2 className="h-4 w-4" />
    case "IN_PROGRESS":
      return <Truck className="h-4 w-4" />
    case "REJECTED":
      return <XCircle className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

export function getOrderStatusVariant(statusCode: string) {
  switch (statusCode) {
    case "APPROVED":
    case "CLOSED":
      return "default" as const
    case "IN_PROGRESS":
      return "secondary" as const
    case "REJECTED":
      return "destructive" as const
    default:
      return "outline" as const
  }
}

export function OrderStatusBadge({
  statusCode,
  statusName,
  className,
}: {
  statusCode: string
  statusName: string
  className?: string
}) {
  return (
    <Badge variant={getOrderStatusVariant(statusCode)} className={className}>
      <OrderStatusIcon statusCode={statusCode} />
      {getOrderStatusLabel(statusCode, statusName)}
    </Badge>
  )
}

export function renderOrderStatus(statusCode: string, statusName: string, className?: string) {
  return <OrderStatusBadge statusCode={statusCode} statusName={statusName} className={className} />
}
