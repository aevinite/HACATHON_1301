
"use client"

import { Settings, User, Mail, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { logoutAction, updateProfileAction } from "@/features/auth"
import { useActionState } from "react"

function SaveButton() {
  return (
    <Button type="submit">
      Save Profile
    </Button>
  )
}

interface SettingsClientProps {
  userEmail: string | null | undefined
  userFullName: string | null | undefined
  userRole: string | undefined
}

export default function SettingsClient({ userEmail, userFullName, userRole }: SettingsClientProps) {
  const [state, formAction] = useActionState(updateProfileAction, {})
  
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Info
            </CardTitle>
            <CardDescription>
              Your account details and role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm">{userEmail || "Not available"}</p>
              </div>
            </div>
            
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  name="fullName" 
                  defaultValue={userFullName || ""}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <Badge variant="secondary" className="mt-1">
                    {userRole || "team"}
                  </Badge>
                </div>
              </div>

              {state.success && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="text-sm text-emerald-400">Profile updated successfully!</p>
                </div>
              )}

              {state.error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <p className="text-sm text-destructive">{state.error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <SaveButton />
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Account Actions
            </CardTitle>
            <CardDescription>
              Sign out of your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={logoutAction}>
              <Button type="submit" variant="destructive" className="w-full sm:w-auto">
                Sign Out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

