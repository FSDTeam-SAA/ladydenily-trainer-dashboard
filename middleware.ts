import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  console.log("TTTTTTTTTTTTT", token)

  const { pathname } = request.nextUrl

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/trainer", "/user", "/courses", "/signal-send", "/offer"]

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // If accessing a protected route without a token → redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated user tries to access auth pages → redirect home
  if (token && pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // 🚨 Role-based restriction
  // Example: block "trainer" role from accessing /dashboard or other protected routes
  if (token && token.role === "trainer") {
    // If trainer tries to access anything except home, force redirect to "/"
    if (isProtectedRoute || pathname.startsWith("/trainer")) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

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
