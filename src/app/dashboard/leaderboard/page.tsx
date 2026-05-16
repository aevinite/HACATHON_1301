
import { ProjectsRepository } from "@/data/repositories/projects-repository"
import { HackathonsRepository } from "@/data/repositories/hackathons-repository"
import LeaderboardClient from "./leaderboard-client"
import { getCurrentProfile } from "@/features/auth/server/session"
import type { Database } from "@/types/supabase"

type Hackathon = Database["public"]["Tables"]["hackathons"]["Row"]

export default async function LeaderboardPage() {
  const profile = await getCurrentProfile()
  const isAdmin = profile?.role === "admin"
  const isJudge = profile?.role === "judge"
  
  const projectsRepo = new ProjectsRepository()
  const hackathonsRepo = new HackathonsRepository()
  const projects = await projectsRepo.findAllWithDetails()
  const allHackathons = await hackathonsRepo.findAll() as Hackathon[]
  
  let visibleHackathons: Hackathon[]
  if (isAdmin) {
    visibleHackathons = allHackathons
  } else if (isJudge) {
    visibleHackathons = allHackathons.filter((h) => h.results_visible_to_judges || h.results_visible_to_participants)
  } else {
    visibleHackathons = allHackathons.filter((h) => h.results_visible_to_participants)
  }
  
  const visibleProjectIds = new Set(visibleHackathons.map((h) => h.id))
  const filteredProjects = isAdmin ? projects : projects.filter(p => visibleProjectIds.has(p.hackathon_id))

  return (
    <LeaderboardClient 
      initialProjects={filteredProjects} 
      initialHackathons={visibleHackathons}
      allHackathons={allHackathons}
      isAdmin={isAdmin}
      isJudge={isJudge}
    />
  )
}

