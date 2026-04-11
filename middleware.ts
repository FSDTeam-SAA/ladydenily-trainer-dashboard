import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const { pathname } = request.nextUrl
  const isAuthPage = pathname.startsWith("/auth")
  const isTrainer = token?.role === "trainer"

  const protectedRoutes = ["/dashboard", "/trainer", "/user", "/courses", "/signal-send", "/offer"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute && (!token || !isTrainer)) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)

    if (token && !isTrainer) {
      loginUrl.searchParams.set("error", "trainer_only")
    }

    return NextResponse.redirect(loginUrl)
  }

  if (token && isTrainer && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url))
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
