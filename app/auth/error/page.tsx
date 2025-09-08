"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { AlertCircle } from "lucide-react"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "CredentialsSignin":
        return "Invalid email or password. Please try again."
      case "OAuthSignin":
        return "Error occurred during sign in. Please try again."
      case "OAuthCallback":
        return "Error occurred during OAuth callback. Please try again."
      case "OAuthCreateAccount":
        return "Could not create OAuth account. Please try again."
      case "EmailCreateAccount":
        return "Could not create email account. Please try again."
      case "Callback":
        return "Error occurred during callback. Please try again."
      case "OAuthAccountNotLinked":
        return "Account not linked. Please sign in with the same provider you used originally."
      case "EmailSignin":
        return "Error sending email. Please try again."
      case "CredentialsSignup":
        return "Error creating account. Please try again."
      case "SessionRequired":
        return "Please sign in to access this page."
      default:
        return "An authentication error occurred. Please try again."
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('/abstract-trading-chart-pattern.jpg')] bg-cover bg-center" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo />
          </div>

          {/* Error Message */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-16 w-16 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Authentication Error</h1>
              <p className="text-slate-600">{getErrorMessage(error)}</p>
            </div>

            <div className="space-y-4">
              <Button
                asChild
                className="w-full h-12 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold rounded-lg"
              >
                <Link href="/auth/login">Try Again</Link>
              </Button>

              <Button asChild variant="outline" className="w-full h-12 rounded-lg bg-transparent">
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
