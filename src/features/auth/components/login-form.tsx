"use client"

import { useActionState, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { loginAction } from "@/features/auth"
import { createClient } from "@/lib/supabase"

const DEMO_ACCOUNTS = [
  {
    label: "Aevinite / Team",
    email: "aevinite@gmail.com",
    password: "ZXA/CXqA4gS3Fw9",
  },
  {
    label: "Judge",
    email: "judge@example.com",
    password: "judge@example.com",
  },
  {
    label: "Admin",
    email: "admin@example.com",
    password: "admin@example.com",
  },
]

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, { error: "" })
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  // Clear any stale auth state on mount
  useEffect(() => {
    console.log("LOGIN FORM: Mounted, clearing stale auth")
    const clearStaleAuth = async () => {
      const supabase = createClient()
      // Try to sign out to clear any stale state
      await supabase.auth.signOut()
      console.log("LOGIN FORM: Stale auth cleared")
    }
    clearStaleAuth()
  }, [])

  const handleDemoLogin = (email: string, password: string) => {
    if (emailInputRef.current) {
      emailInputRef.current.value = email
    }
    if (passwordInputRef.current) {
      passwordInputRef.current.value = password
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your HackJudge account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Demo Accounts Section */}
        <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wider">
            Demo Accounts
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <Button
                key={account.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin(account.email, account.password)}
                disabled={isPending}
              >
                {account.label}
              </Button>
            ))}
          </div>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              disabled={isPending}
              ref={emailInputRef}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={isPending}
              ref={passwordInputRef}
            />
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
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-primary hover:underline">
            Sign up
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
