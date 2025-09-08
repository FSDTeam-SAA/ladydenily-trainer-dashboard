"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import { Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Password reset link sent to your email")
        setTimeout(() => {
          router.push("/auth/verify-otp")
        }, 2000)
      } else {
        setMessage(data.message || "An error occurred")
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
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

          {/* Forgot Password Form */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Forgot Password</h1>
              <p className="text-slate-600">
                Enter the email address associated with your account. We'll send you an OTP to your email.
              </p>
            </div>

            {message && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  message.includes("sent")
                    ? "bg-green-50 border border-green-200 text-green-600"
                    : "bg-red-50 border border-red-200 text-red-600"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="sr-only">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-slate-100 border-0 rounded-lg"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Continue"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
