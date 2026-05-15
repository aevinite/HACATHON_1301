"use client"

import { useActionState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signupAction } from "@/features/auth"
import { createClient } from "@/lib/supabase"

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signupAction, { error: "" })

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

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Join HackJudge to start judging hackathons
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="John Doe"
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              disabled={isPending}
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
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline">
            Sign in
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
