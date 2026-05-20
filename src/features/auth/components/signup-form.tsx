"use client"

import { useActionState, useEffect, useState } from "react"
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signupAction } from "@/features/auth"
import { createClient } from "@/lib/supabase"
import Link from "next/link"
import { GoogleOAuthButton } from "./google-oauth-button"

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signupAction, { error: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Clear any stale auth state on mount
  useEffect(() => {
    console.log("SIGNUP FORM: Mounted, clearing stale auth")
    const clearStaleAuth = async () => {
      const supabase = createClient()
      // Try to sign out to clear any stale state
      await supabase.auth.signOut()
      console.log("SIGNUP FORM: Stale auth cleared")
    }
    clearStaleAuth()
  }, [])

  const passwordRules = [
    { label: "At least 8 characters", check: (p: string) => p.length >= 8 },
    { label: "At least one uppercase letter", check: (p: string) => /[A-Z]/.test(p) },
    { label: "At least one lowercase letter", check: (p: string) => /[a-z]/.test(p) },
    { label: "At least one number", check: (p: string) => /[0-9]/.test(p) },
  ]

  const handleFormAction = async (formData: FormData) => {
    formData.set("fullName", fullName)
    formData.set("email", email)
    formData.set("password", password)
    return formAction(formData)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Join HackJudge to start judging hackathons
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleFormAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              required
              disabled={isPending}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              disabled={isPending}
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
                disabled={isPending}
                className="pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isPending}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="space-y-1 mt-2">
              {passwordRules.map((rule, index) => {
                const passed = rule.check(password)
                return (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    {passed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={passed ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                      {rule.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          {state.error && (
            <div className="text-sm text-destructive">
              {state.error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-800" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">or</span>
          </div>
        </div>
        <GoogleOAuthButton text="Sign up with Google" />
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
