"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  useEffect(() => {
    // Check if user is already authenticated
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push(callbackUrl)
      }
    }
    checkSession()
  }, [router, callbackUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Invalid email or password")
        setError("Invalid email or password")
      } else {
        toast.success("Login successful!")
        // Get session to ensure user is authenticated
        const session = await getSession()
        if (session) {
          router.push(callbackUrl)
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
      setError("An error occurred. Please try again.")
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

          {/* Login Form */}
          <div className="">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Hello,Welcome!</h1>
              <p className="text-slate-600">Please Enter Your Details Below to Continue</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 bg-[#E8ECF1] p-6 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="email" className="sr-only text-[#4E4E4E]">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4E4E4E] h-5 w-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-[#B8C3D4] border-0 rounded-lg placeholder:text-[#4E4E4E] text-[#4E4E4E]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="sr-only">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4E4E4E] h-5 w-5" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-[#B8C3D4] border-0 rounded-lg text-[#4E4E4E]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#4E4E4E] hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Link href="/auth/forgot-password" className="text-sm text-slate-600 hover:text-slate-800">
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Login"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
