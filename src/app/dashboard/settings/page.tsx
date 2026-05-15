import { Settings, User, Mail, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser, getCurrentProfile } from "@/features/auth/server/session"
import { logoutAction } from "@/features/auth"

export default async function SettingsPage() {
  const user = await getCurrentUser()
  const profile = await getCurrentProfile()

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
                <p className="text-sm">{user?.email || "Not available"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="text-sm">{profile?.full_name || "Not set"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <Badge variant="secondary" className="mt-1">
                  {profile?.role || "team"}
                </Badge>
              </div>
            </div>
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
