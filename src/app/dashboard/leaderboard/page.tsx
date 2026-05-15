
import { ProjectsRepository } from "@/data/repositories/projects-repository"
import { HackathonsRepository } from "@/data/repositories/hackathons-repository"
import LeaderboardClient from "./leaderboard-client"

export default async function LeaderboardPage() {
  const projectsRepo = new ProjectsRepository()
  const hackathonsRepo = new HackathonsRepository()
  const projects = await projectsRepo.findAllWithDetails()
  const hackathons = await hackathonsRepo.findAll()

  return (
    <LeaderboardClient initialProjects={projects} initialHackathons={hackathons} />
  )
}
