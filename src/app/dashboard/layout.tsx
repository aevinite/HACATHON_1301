
import { requireAuth } from "@/features/auth"
import { getCurrentProfile } from "@/features/auth/server/session"
import { AppShell } from "@/components/shell/app-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()
  const profile = await getCurrentProfile()
  
  return <AppShell role={profile?.role as "admin" | "judge" | "team"}>{children}</AppShell>
}

