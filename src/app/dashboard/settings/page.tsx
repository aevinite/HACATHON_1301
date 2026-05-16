
import SettingsClient from "./settings-client"
import { getCurrentUser, getCurrentProfile } from "@/features/auth/server/session"

export default async function SettingsPage() {
  const user = await getCurrentUser()
  const profile = await getCurrentProfile()

  return (
    <SettingsClient 
      userEmail={user?.email} 
      userFullName={profile?.full_name} 
      userRole={profile?.role}
    />
  )
}

