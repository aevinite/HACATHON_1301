
import { redirect } from "next/navigation"
import { HackathonsRepository } from "@/data/repositories/hackathons-repository"
import { getCurrentProfile } from "@/features/auth/server/session"
import AdminHackathonsClient from "./admin-hackathons-client"

export default async function AdminHackathonsPage() {
  const profile = await getCurrentProfile()
  const role = profile?.role || "team"

  // Only allow admins
  if (role !== "admin") {
    redirect("/dashboard")
  }

  const repository = new HackathonsRepository()
  const hackathons = await repository.findAllWithCounts()

  return (
    <div className="p-6 md:p-8">
      <AdminHackathonsClient initialHackathons={hackathons} />
    </div>
  )
}
