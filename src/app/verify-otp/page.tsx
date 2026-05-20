
"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { verifyOtpAction, resendOtpAction } from "@/features/auth"
import Link from "next/link"

export default function VerifyOtpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const message = searchParams.get("message")
  const otpInputRef = useRef<HTMLInputElement>(null)
  
  const [verifyState, verifyFormAction, isVerifyPending] = useActionState(verifyOtpAction, { error: "", success: false })
  const [resendState, resendFormAction, isResendPending] = useActionState(resendOtpAction, { error: "", success: false, message: "" })
  const [otpValue, setOtpValue] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)
  const [showResendSuccess, setShowResendSuccess] = useState(false)

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    value = value.replace(/\s+/g, "")
    setOtpValue(value)
  }

  useEffect(() => {
    if (!email) {
      router.push("/signup")
    }
  }, [email, router])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  useEffect(() => {
    if (resendState.success && resendState.message) {
      setShowResendSuccess(true)
      setResendCooldown(60)
      const timer = setTimeout(() => setShowResendSuccess(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [resendState.success, resendState.message])

  const handleResendFormAction = async (formData: FormData) => {
    formData.set("email", email!)
    setOtpValue("")
    otpInputRef.current?.focus()
    return resendFormAction(formData)
  }

  if (!email) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/signup">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
          </div>
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>
            We sent a verification code to {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message === "already_registered" && (
            <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              This email is already signed up but not verified. Please verify your email.
            </div>
          )}
          {message === "new_otp" && (
            <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              A verified account does not exist yet. We sent a new verification code.
            </div>
          )}
          <form action={verifyFormAction} className="space-y-4">
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="otp" value={otpValue} />
            <div className="space-y-2">
              <Label htmlFor="otp">Verification code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter the full verification code from your email"
                required
                disabled={isVerifyPending}
                maxLength={12}
                ref={otpInputRef}
                value={otpValue}
                onChange={handleOtpChange}
              />
            </div>
            {verifyState.error && (
              <div className="text-sm text-destructive">
                {verifyState.error}
              </div>
            )}
            {resendState.error && (
              <div className="text-sm text-destructive">
                {resendState.error}
              </div>
            )}
            {showResendSuccess && (
              <div className="text-sm text-green-600 dark:text-green-400">
                {resendState.message || "Verification code resent!"}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isVerifyPending}>
              {isVerifyPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify code"
              )}
            </Button>
          </form>
          <div className="text-center text-sm">
            Didn&apos;t receive the code?{" "}
            <form action={handleResendFormAction} className="inline">
              <button
                type="submit"
                className="text-primary hover:underline bg-transparent border-none p-0 cursor-pointer font-medium"
                disabled={isResendPending || resendCooldown > 0}
              >
                {isResendPending ? "Resending..." : resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
              </button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
