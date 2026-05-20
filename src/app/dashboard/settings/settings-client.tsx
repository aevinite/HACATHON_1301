"use client"

import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase"
import Link from "next/link"
import { Loader2, ArrowRight, LogOut } from "lucide-react"
import { logoutAction } from "@/features/auth"

interface SettingsClientProps {
  userEmail?: string
  userFullName?: string
  userRole?: string
}

export default function SettingsClient({ userEmail, userFullName }: SettingsClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [fullName, setFullName] = useState("")
  const supabase = createClient()

  useEffect(() => {
    if (userFullName) {
      setFullName(userFullName)
    }
  }, [userFullName])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    })

    setIsLoading(false)
    if (!error) {
      window.location.reload()
    }
  }

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction()
    })
  }

  const userInitials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "U"

  if (!userEmail) {
    return null
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <div className="max-w-2xl space-y-8">
        <Card className="border border-blue-500/30 shadow-lg shadow-blue-500/10 bg-card/80 backdrop-blur-sm rounded-2xl">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your public profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userEmail || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-blue-500/30 shadow-lg shadow-blue-500/10 bg-card/80 backdrop-blur-sm rounded-2xl">
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Manage your password using secure email reset</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To change your password, use email reset. This also works if you signed up with Google and want to create a password.
              </p>
              <Button asChild>
                <Link href={`/forgot-password?email=${encodeURIComponent(userEmail || "")}`}>
                  Reset password by email <ArrowRight className="inline-block h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-red-500/20 bg-card/80 backdrop-blur-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-red-500">Danger Zone</CardTitle>
            <CardDescription>Account actions that cannot be undone</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isPending ? "Logging out..." : "Log out"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
