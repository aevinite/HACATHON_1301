
import { redirect } from "next/navigation"
import { TeamsRepository } from "@/data/repositories/teams-repository"
import { HackathonsRepository } from "@/data/repositories/hackathons-repository"
import { getCurrentProfile } from "@/features/auth/server/session"
import AdminTeamsClient from "./admin-teams-client"

type AdminTeamsPageProps = {
  params: Promise<{}>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminTeamsPage({ params, searchParams }: AdminTeamsPageProps) {
  const profile = await getCurrentProfile()
  const role = profile?.role || "team"

  if (role !== "admin") {
    redirect("/dashboard")
  }

  const teamsRepo = new TeamsRepository()
  const hackathonsRepo = new HackathonsRepository()
  const teams = await teamsRepo.findAllWithDetails()
  
  const resolvedSearchParams = await searchParams
  const hackathonId = typeof resolvedSearchParams.hackathonId === "string" ? resolvedSearchParams.hackathonId : undefined
  
  let hackathonName = "Selected hackathon"
  if (hackathonId) {
    const hackathon = await hackathonsRepo.findById(hackathonId)
    if (hackathon) {
      hackathonName = hackathon.name
    }
  }

  return (
    <div className="p-6 md:p-8">
      <AdminTeamsClient initialTeams={teams} initialHackathonId={hackathonId} hackathonName={hackathonName} />
    </div>
  )
}
