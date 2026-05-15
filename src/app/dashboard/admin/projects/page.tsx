
import { redirect } from "next/navigation"
import { ProjectsRepository } from "@/data/repositories/projects-repository"
import { HackathonsRepository } from "@/data/repositories/hackathons-repository"
import { getCurrentProfile } from "@/features/auth/server/session"
import AdminProjectsClient from "./admin-projects-client"

type AdminProjectsPageProps = {
  params: Promise<{}>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminProjectsPage({ params, searchParams }: AdminProjectsPageProps) {
  const profile = await getCurrentProfile()
  const role = profile?.role || "team"

  if (role !== "admin") {
    redirect("/dashboard")
  }

  const projectsRepo = new ProjectsRepository()
  const hackathonsRepo = new HackathonsRepository()
  const projects = await projectsRepo.findAllWithDetails()
  
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
      <AdminProjectsClient initialProjects={projects} initialHackathonId={hackathonId} hackathonName={hackathonName} />
    </div>
  )
}
