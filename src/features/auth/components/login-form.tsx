"use client"

import { useActionState, useRef, useState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { loginAction } from "@/features/auth"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { GoogleOAuthButton } from "./google-oauth-button"

const demoAccounts = [
  {
    name: "Admin",
    email: "admin@example.com",
    password: "admin@example.com",
  },
  {
    name: "Judge",
    email: "judge@example.com",
    password: "judge@example.com",
  },
  {
    name: "Team",
    email: "team@example.com",
    password: "team@example.com",
  },
]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        "Sign in"
      )}
    </Button>
  )
}

export function LoginForm({ message }: { message?: string | null }) {
  const [state, formAction] = useActionState(loginAction, { error: "" })
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Clear any stale auth state on mount
  useEffect(() => {
    console.log("LOGIN FORM: Mounted, clearing stale auth")
    const clearStaleAuth = async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      console.log("LOGIN FORM: Stale auth cleared")
    }
    clearStaleAuth()
  }, [])

  const handleDemoLogin = (accEmail: string, accPassword: string) => {
    setEmail(accEmail)
    setPassword(accPassword)
  }

  const handleFormAction = async (formData: FormData) => {
    formData.set("email", email)
    formData.set("password", password)
    return formAction(formData)
  }

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start">
      {/* Left Column (Desktop: Demo Accounts */}
      <div className="w-full order-2 md:order-1">
        <Card className="w-full border border-blue-500/30 shadow-lg shadow-blue-500/10 bg-card/80 backdrop-blur-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Demo Accounts</CardTitle>
            <CardDescription>
              Use these demo accounts for quick testing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demoAccounts.map((account) => (
                <div
                  key={account.name}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => handleDemoLogin(account.email, account.password)}
                >
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-muted-foreground">{account.email}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Use
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column (Desktop): Welcome back/login */}
      <div className="w-full order-1 md:order-2">
        <Card className="w-full border border-blue-500/30 shadow-lg shadow-blue-500/10 bg-card/80 backdrop-blur-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your HackJudge account</CardDescription>
          </CardHeader>
          <CardContent>
            {message === "password-updated" && (
              <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Password updated successfully. Please login.</p>
              </div>
            )}
            <form action={handleFormAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  ref={emailInputRef}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    ref={passwordInputRef}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              {state.error && (
                <div className="text-sm">
                  <div className="text-destructive">{state.error}</div>
                  {state.error.includes("No verified account exists") && (
                    <Link href="/signup" className="text-primary hover:underline mt-1 inline-block">
                      Sign up instead →
                    </Link>
                  )}
                  {state.error.includes("Please verify your email") && email && (
                    <Link
                      href={`/verify-otp?email=${encodeURIComponent(email)}`}
                      className="text-primary hover:underline mt-1 inline-block"
                    >
                      Verify email →
                    </Link>
                  )}
                </div>
              )}
              <SubmitButton />
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">or</span>
              </div>
            </div>

            <GoogleOAuthButton text="Continue with Google" />

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up <ArrowRight className="inline-block h-3 w-3 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
