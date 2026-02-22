"use client"

import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

type CopySkuButtonProps = {
  sku: string
  className?: string
}

export function CopySkuButton({ sku, className }: CopySkuButtonProps) {
  const copySku = async () => {
    try {
      await navigator.clipboard.writeText(sku)
      toast({
        title: "Артикул скопирован",
        description: sku,
      })
    } catch {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать артикул.",
        variant: "destructive",
      })
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className ?? "h-7 px-2"}
      onClick={() => void copySku()}
    >
      <Copy className="h-3.5 w-3.5 mr-1" />
      Копировать
    </Button>
  )
}
