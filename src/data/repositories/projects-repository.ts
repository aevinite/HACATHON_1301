
import { BaseRepository } from "./base-repository"
import type { Database } from "@/types/supabase"

type Project = Database["public"]["Tables"]["projects"]["Row"]
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"]
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"]
type Hackathon = Database["public"]["Tables"]["hackathons"]["Row"]
type Team = Database["public"]["Tables"]["teams"]["Row"]

type ProjectWithDetails = Project & {
  hackathons: Hackathon | null
  teams: Team | null
}

export class ProjectsRepository extends BaseRepository<Project> {
  constructor() {
    super("projects")
  }

  async findById(projectId: string): Promise<Project | null> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle()

    return data
  }

  async findByTeamId(teamId: string): Promise<Project | null> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("team_id", teamId)
      .maybeSingle()

    return data
  }

  async findByHackathonId(hackathonId: string): Promise<Project[]> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("hackathon_id", hackathonId)
      .order("created_at", { ascending: false })

    return data || []
  }

  async findAllWithDetails(): Promise<ProjectWithDetails[]> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("projects")
      .select(`
        *,
        hackathons (*),
        teams (*)
      `)
      .order("created_at", { ascending: false })

    return (data as any[]) || []
  }

  async createProject(payload: Omit<ProjectInsert, "id" | "created_at" | "updated_at">): Promise<Project> {
    console.log("========== ProjectsRepository.createProject START ==========")
    console.log("ProjectsRepository.createProject: Table: projects")
    console.log("ProjectsRepository.createProject: Payload:", payload)
    
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from("projects")
      .insert(payload)
      .select("*")
      .single()

    console.log("ProjectsRepository.createProject: Data:", data)
    console.log("ProjectsRepository.createProject: Error:", error ? JSON.stringify(error, null, 2) : "none")
    console.log("========== ProjectsRepository.createProject END ==========")

    if (error) throw error
    return data
  }

  async updateProject(projectId: string, payload: ProjectUpdate): Promise<Project> {
    console.log("========== ProjectsRepository.updateProject START ==========")
    console.log("ProjectsRepository.updateProject: Project ID:", projectId)
    console.log("ProjectsRepository.updateProject: Payload:", payload)
    
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from("projects")
      .update(payload)
      .eq("id", projectId)
      .select("*")
      .single()

    console.log("ProjectsRepository.updateProject: Data:", data)
    console.log("ProjectsRepository.updateProject: Error:", error ? JSON.stringify(error, null, 2) : "none")
    console.log("========== ProjectsRepository.updateProject END ==========")

    if (error) throw error
    return data
  }
}
