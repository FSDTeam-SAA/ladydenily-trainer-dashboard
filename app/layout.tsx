import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { Suspense } from "react"
import { Providers } from "@/components/providers"
import { LayoutWrapper } from "@/components/layout-wrapper"
import "./globals.css"

export const metadata: Metadata = {
  title: "Legendary Trading Academy",
  description: "Admin Dashboard for Legendary Trading Academy",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
    >
      <body>
        <Suspense fallback={null}>
          <Providers>
            <LayoutWrapper>{children}</LayoutWrapper>
            <Toaster />
          </Providers>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
