import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const { pathname } = request.nextUrl

  // Auth routes (like login, signup, etc.)
  const isAuthPage = pathname.startsWith("/auth")

  // Protected routes
  const protectedRoutes = ["/dashboard", "/trainer", "/user", "/courses", "/signal-send", "/offer"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const allowedRoles = ["trainer", "admin"]

  // 🔒 If no token → redirect to login
  if (!token) {
    if (isProtectedRoute) {
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // 🚫 If logged in but NOT allowed → block access to protected routes
  if (isProtectedRoute && !allowedRoles.includes(token.role as string)) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("error", "unauthorized")
    return NextResponse.redirect(loginUrl)
  }

  // 🧭 If a logged-in user tries to access /auth pages, redirect home
  if (isAuthPage && allowedRoles.includes(token.role as string)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // ✅ Allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/trainer/:path*",
    "/user/:path*",
    "/courses/:path*",
    "/signal-send/:path*",
    "/offer/:path*",
    "/auth/:path*",
  ],
}
