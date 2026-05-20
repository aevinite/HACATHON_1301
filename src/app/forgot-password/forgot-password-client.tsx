"use client"

import { useActionState, useEffect, useState } from "react"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { forgotPasswordAction } from "@/features/auth"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

export function ForgotPasswordClient({ initialEmail }: { initialEmail?: string }) {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, { error: "", success: false, message: "" })
  const [email, setEmail] = useState(initialEmail || "")
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    console.log("FORGOT PASSWORD FORM: Mounted, clearing stale auth")
    const clearStaleAuth = async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      console.log("FORGOT PASSWORD FORM: Stale auth cleared")
    }
    clearStaleAuth()
  }, [])

  useEffect(() => {
    if (state.success && state.message) {
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [state.success, state.message])

  const handleFormAction = async (formData: FormData) => {
    formData.set("email", email)
    return formAction(formData)
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border border-blue-500/30 shadow-lg shadow-blue-500/10 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-4 mb-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/login">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              {state.message}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border border-blue-500/30 shadow-lg shadow-blue-500/10 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/login">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
          </div>
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send a password reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleFormAction} className="space-y-4">
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
            {state.error && (
              <div className="text-sm text-destructive">
                {state.error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
