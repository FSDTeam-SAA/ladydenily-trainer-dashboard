import NextAuth, { type DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string
      role?: string
    }
    accessToken?: string
    refreshToken?: string
    error?: string
  }

  interface User {
    id: string
    role?: string
    accessToken?: string
    refreshToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    error?: string
  }
}
