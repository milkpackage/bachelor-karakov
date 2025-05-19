"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react"
import Header from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const justRegistered = searchParams.get("registered") === "true"
  const { login, isLoading } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(justRegistered)
  const [isEmailNotConfirmed, setIsEmailNotConfirmed] = useState(false)

  useEffect(() => {
    if (justRegistered) {
      // Hide the success message after 5 seconds
      const timer = setTimeout(() => {
        setShowRegistrationSuccess(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [justRegistered])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError(null)

    if (!validateForm()) return

    try {
      const result = await login(formData.email, formData.password)

      if (!result.success) {
        if (result.isEmailNotConfirmed) {
          // Special handling for email not confirmed
          setApiError(result.error)
          setIsEmailNotConfirmed(true)
          return
        }
        throw new Error(result.error || "Invalid email or password")
      }

      // Redirect to dashboard on success
      router.push("/")
    } catch (error) {
      console.error("Login error:", error)
      setApiError("Invalid email or password. Please try again.")
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#0c0c10] dark:to-[#0c0c10]">
      <Header />
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="w-full max-w-md">
          <Button variant="ghost" className="mb-4" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Sign in to your account to continue your mental health journey.</CardDescription>
            </CardHeader>
            <CardContent>
              {showRegistrationSuccess && (
                <Alert className="mb-4 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Registration Successful</AlertTitle>
                  <AlertDescription>Your account has been created. You can now sign in.</AlertDescription>
                </Alert>
              )}

              {apiError && (
                <Alert
                  variant={isEmailNotConfirmed ? "warning" : "destructive"}
                  className={
                    isEmailNotConfirmed
                      ? "mb-4 bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-700 dark:text-amber-300"
                      : "mb-4"
                  }
                >
                  {isEmailNotConfirmed ? <Mail className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <AlertTitle>{isEmailNotConfirmed ? "Email Confirmation Required" : "Error"}</AlertTitle>
                  <AlertDescription>{apiError}</AlertDescription>
                  {isEmailNotConfirmed && (
                    <Button
                      variant="link"
                      className="mt-2 h-auto p-0 text-amber-700 dark:text-amber-300"
                      onClick={async () => {
                        try {
                          const { error } = await supabase.auth.resend({
                            type: "signup",
                            email: formData.email,
                          })

                          if (error) throw error

                          alert("Confirmation email resent. Please check your inbox.")
                        } catch (err) {
                          console.error("Error resending confirmation:", err)
                          alert("Failed to resend confirmation email. Please try again later.")
                        }
                      }}
                    >
                      Resend confirmation email
                    </Button>
                  )}
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john.doe@example.com"
                    autoComplete="email"
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <div className="flex items-center justify-end">
                  <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/auth/register" className="text-primary hover:underline">
                  Create an account
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  )
}
