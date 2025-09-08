"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(43)
  const [message, setMessage] = useState("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpString = otp.join("")

    if (otpString.length !== 6) {
      setMessage("Please enter all 6 digits")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp: otpString }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push("/auth/update-password")
      } else {
        setMessage(data.message || "Invalid OTP")
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setCountdown(43)
    // Add resend logic here
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

          {/* OTP Verification Form */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Verify OTP</h1>
              <p className="text-slate-600">
                We'll send a verification code to your email. Check your inbox and enter the code here.
              </p>
            </div>

            {message && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{message}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl font-semibold bg-slate-100 border-0 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  />
                ))}
              </div>

              <div className="text-center">
                <p className="text-sm text-slate-600">Resend code in {countdown}s</p>
                {countdown === 0 && (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-sm text-blue-600 hover:text-blue-800 mt-1"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
