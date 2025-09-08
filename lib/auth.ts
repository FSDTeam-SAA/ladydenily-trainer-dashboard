import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { authAPI } from "./api"

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
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role as string
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development-only-please-change-in-production",
}
