import type { NextAuthOptions } from "next-auth"
import type { JWT } from "next-auth/jwt"
import CredentialsProvider from "next-auth/providers/credentials"
import { authAPI } from "./api"

const API_BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001").replace(/\/$/, "")

const decodeJwtPayload = (token: string) => {
  const [, payload] = token.split(".")
  if (!payload) return null
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=")
    return JSON.parse(Buffer.from(padded, "base64").toString("utf-8"))
  } catch (error) {
    return null
  }
}

const getAccessTokenExpiresAt = (accessToken?: string) => {
  if (!accessToken) return 0
  const payload = decodeJwtPayload(accessToken)
  if (!payload?.exp) return 0
  return Number(payload.exp) * 1000
}

const refreshAccessToken = async (token: JWT): Promise<JWT> => {
  if (!token.refreshToken) {
    return { ...token, error: "RefreshTokenMissing" }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    })

    const data = await response.json()

    if (!response.ok || !data?.data?.accessToken) {
      throw new Error(data?.message || "Failed to refresh token")
    }

    const accessToken = data.data.accessToken
    const refreshToken = data.data.refreshToken || token.refreshToken

    return {
      ...token,
      accessToken,
      refreshToken,
      accessTokenExpires: getAccessTokenExpiresAt(accessToken),
      error: undefined,
    }
  } catch (error) {
    console.error("Refresh token error:", error)
    return { ...token, error: "RefreshAccessTokenError" }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const response = await authAPI.login(credentials.email, credentials.password)

          console.log("RRRRRRRRRRRRRR", response)

          if (response.success && response.data) {
            return {
              id: response.data._id,
              email: response.data.user.email,
              name: response.data.user.name,
              role: response.data.role,
              accessToken: response.data.accessToken,
              refreshToken: response.data.refreshToken,
            }
          }

          return null
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {

      console.log("UUUUUUUUUUUUUUU", token)
      if (user) {
        token.role = user.role
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.accessTokenExpires = getAccessTokenExpiresAt(user.accessToken)
        return token
      }

      if (token.accessToken && token.accessTokenExpires) {
        const expiresSoon = Date.now() >= token.accessTokenExpires - 60 * 1000
        if (!expiresSoon) {
          return token
        }
      }

      return await refreshAccessToken(token)
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role as string
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
        session.error = token.error as string | undefined
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development-only-please-change-in-production",
}
