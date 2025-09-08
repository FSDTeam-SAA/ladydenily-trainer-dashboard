import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function getRequiredServerSession() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  return session
}

export async function getOptionalServerSession() {
  return await getServerSession(authOptions)
}

// Client-side auth utilities
export const AUTH_ROUTES = {
  LOGIN: "/auth/login",
  FORGOT_PASSWORD: "/auth/forgot-password",
  VERIFY_OTP: "/auth/verify-otp",
  UPDATE_PASSWORD: "/auth/update-password",
  ERROR: "/auth/error",
} as const

export const PROTECTED_ROUTES = ["/dashboard", "/trainer", "/user", "/courses", "/signal-send", "/offer"] as const

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
}

export function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith("/auth")
}
