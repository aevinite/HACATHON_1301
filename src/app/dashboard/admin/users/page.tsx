
import { redirect } from "next/navigation"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"
import { getCurrentProfile } from "@/features/auth/server/session"
import AdminUsersClient from "./admin-users-client"

export default async function AdminUsersPage() {
  const profile = await getCurrentProfile()
  const role = profile?.role || "team"

  if (role !== "admin") {
    redirect("/dashboard")
  }

  const repository = new ProfilesRepository()
  const profiles = await repository.findAll()

  return (
    <div className="p-6 md:p-8">
      <AdminUsersClient initialProfiles={profiles} />
    </div>
  )
}

