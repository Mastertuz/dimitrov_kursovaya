import type { Metadata, Viewport } from "next"
import { AppProviders } from "@/components/providers/app-providers"
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin"
import { extractRouterConfig } from "uploadthing/server"
import { ourFileRouter } from "@/app/api/uploadthing/core"

import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Магазин Одежды - Учет продаж",
    template: "%s | Магазин Одежды",
  },
  description:
    "Информационная система магазина одежды с учетом продаж и AI-прогнозированием спроса по размерам",
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body suppressHydrationWarning className="font-sans antialiased">
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
