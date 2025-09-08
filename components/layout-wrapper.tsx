"use client"

import DashboardLayout from "@/app/dashboard/layout"
import { usePathname } from "next/navigation"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const noDashboardRoutes = [
    "/auth/login",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/verify-otp",
  ]

  return noDashboardRoutes.includes(pathname) ? (
    <>{children}</>
  ) : (
    <DashboardLayout>{children}</DashboardLayout>
  )
}
