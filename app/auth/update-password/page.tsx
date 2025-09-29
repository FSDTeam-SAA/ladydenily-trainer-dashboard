"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import { Eye, EyeOff, Lock } from "lucide-react"
import Image from "next/image"

export default function UpdatePasswordPage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/update-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Password updated successfully")
        setTimeout(() => {
          router.push("/auth/login")
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
            <Image src="/LTA_LOGO.png" alt="Logo" width={100} height={100} className="w-[151px] h-[80px]" />
          </div>

          {/* Update Password Form */}
          <div className="">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Update Password</h1>
              <p className="text-slate-600">Create your new password</p>
            </div>

            {message && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  message.includes("successfully")
                    ? "bg-green-50 border border-green-200 text-green-600"
                    : "bg-red-50 border border-red-200 text-red-600"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 bg-[#E8ECF1] p-6 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="sr-only">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-[#B8C3D4] border-0 rounded-lg"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="sr-only">
                  Repeat New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-[#B8C3D4] border-0 rounded-lg"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Continue"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
