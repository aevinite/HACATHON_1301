
"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase-server"
import { ProjectsRepository } from "@/data/repositories/projects-repository"
import { TeamsRepository } from "@/data/repositories/teams-repository"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"

export async function createProjectAction(formData: FormData) {
  console.log("========== createProjectAction START ==========")
  
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  console.log("createProjectAction: User:", user?.id || null)
  
  if (!user) {
    console.log("========== createProjectAction END (REDIRECT TO LOGIN) ==========")
    redirect("/login")
  }

  const teamId = formData.get("team_id") as string
  const hackathonId = formData.get("hackathon_id") as string
  const name = formData.get("name") as string
  const tagline = formData.get("tagline") as string
  const description = formData.get("description") as string
  const githubUrl = formData.get("github_url") as string
  const liveUrl = formData.get("live_url") as string

  console.log("createProjectAction: Form data:", { teamId, hackathonId, name, tagline, description, githubUrl, liveUrl })

  if (!teamId || !hackathonId || !name || !tagline || !description) {
    console.log("createProjectAction: Missing required fields")
    console.log("========== createProjectAction END (MISSING FIELDS) ==========")
    redirect(`/dashboard/teams/${teamId}`)
  }

  const projectsRepo = new ProjectsRepository()
  const teamsRepo = new TeamsRepository()

  try {
    console.log("createProjectAction: Verifying user belongs to team")
    const team = await teamsRepo.findByHackathonAndUserId(hackathonId, user.id)
    console.log("createProjectAction: Team check result:", team ? team.id : null)
    
    if (!team || team.id !== teamId) {
      console.log("createProjectAction: User not in team")
      console.log("========== createProjectAction END (NOT IN TEAM) ==========")
      redirect(`/dashboard/teams/${teamId}`)
    }

    console.log("createProjectAction: Checking for existing project")
    const existingProject = await projectsRepo.findByTeamId(teamId)
    console.log("createProjectAction: Existing project:", existingProject ? existingProject.id : null)
    
    if (existingProject) {
      console.log("createProjectAction: Team already has a project")
      console.log("========== createProjectAction END (EXISTING PROJECT) ==========")
      redirect(`/dashboard/teams/${teamId}`)
    }

    const payload = {
      name,
      tagline,
      description,
      hackathon_id: hackathonId,
      team_id: teamId,
      submitted_by: user.id,
      github_url: githubUrl || null,
      live_url: liveUrl || null,
      status: "submitted" as const,
    }

    console.log("createProjectAction: Creating project with payload:", payload)
    
    await projectsRepo.createProject(payload)

    console.log("createProjectAction: Project created successfully!")
    revalidatePath(`/dashboard/teams/${teamId}`)
    console.log("========== createProjectAction END (SUCCESS) ==========")
    redirect(`/dashboard/teams/${teamId}`)
  } catch (error) {
    console.error("createProjectAction: Failed to create project:", error)
    console.log("========== createProjectAction END (ERROR) ==========")
    redirect(`/dashboard/teams/${teamId}`)
  }
}

export async function disqualifyProjectAction(prevState: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  console.log("========== disqualifyProjectAction START ==========")
  
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  console.log("disqualifyProjectAction: User:", user?.id || null)
  
  if (!user) {
    console.log("========== disqualifyProjectAction END (REDIRECT TO LOGIN) ==========")
    return { error: "Not authenticated" }
  }

  const profilesRepo = new ProfilesRepository()
  const userProfile = await profilesRepo.findByUserId(user.id)

  if (!userProfile || userProfile.role !== "admin") {
    console.log("disqualifyProjectAction: Not admin")
    return { error: "Unauthorized: Only admins can disqualify projects" }
  }

  const projectId = formData.get("project_id") as string
  console.log("disqualifyProjectAction: Project ID:", projectId)

  if (!projectId) {
    return { error: "Missing project ID" }
  }

  const projectsRepo = new ProjectsRepository()

  try {
    await projectsRepo.updateProject(projectId, { status: "disqualified" as const })
    revalidatePath("/dashboard/admin/projects")
    console.log("========== disqualifyProjectAction END (SUCCESS) ==========")
    return {}
  } catch (error) {
    console.error("disqualifyProjectAction: Failed to disqualify project:", error)
    console.log("========== disqualifyProjectAction END (ERROR) ==========")
    return { error: "Failed to disqualify project" }
  }
}

export async function restoreProjectAction(prevState: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  console.log("========== restoreProjectAction START ==========")
  
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  console.log("restoreProjectAction: User:", user?.id || null)
  
  if (!user) {
    console.log("========== restoreProjectAction END (REDIRECT TO LOGIN) ==========")
    return { error: "Not authenticated" }
  }

  const profilesRepo = new ProfilesRepository()
  const userProfile = await profilesRepo.findByUserId(user.id)

  if (!userProfile || userProfile.role !== "admin") {
    console.log("restoreProjectAction: Not admin")
    return { error: "Unauthorized: Only admins can restore projects" }
  }

  const projectId = formData.get("project_id") as string
  console.log("restoreProjectAction: Project ID:", projectId)

  if (!projectId) {
    return { error: "Missing project ID" }
  }

  const projectsRepo = new ProjectsRepository()

  try {
    await projectsRepo.updateProject(projectId, { status: "submitted" as const })
    revalidatePath("/dashboard/admin/projects")
    console.log("========== restoreProjectAction END (SUCCESS) ==========")
    return {}
  } catch (error) {
    console.error("restoreProjectAction: Failed to restore project:", error)
    console.log("========== restoreProjectAction END (ERROR) ==========")
    return { error: "Failed to restore project" }
  }
}
