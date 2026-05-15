import { requireAuth } from "@/features/auth"
import { getCurrentProfile } from "@/features/auth/server/session"
import { AppShell } from "@/components/shell/app-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log("DASHBOARD LAYOUT: Calling requireAuth()")
  await requireAuth()
  const profile = await getCurrentProfile()
  console.log("DASHBOARD LAYOUT: requireAuth() passed, rendering AppShell, role:", profile?.role)
  
  return <AppShell role={profile?.role as "admin" | "judge" | "team"}>{children}</AppShell>
}
