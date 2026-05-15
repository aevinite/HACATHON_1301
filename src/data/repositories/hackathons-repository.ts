import { BaseRepository } from "./base-repository"
import type { Database } from "@/types/supabase"

type Hackathon = Database["public"]["Tables"]["hackathons"]["Row"]
type HackathonInsert = Database["public"]["Tables"]["hackathons"]["Insert"]
type HackathonUpdate = Database["public"]["Tables"]["hackathons"]["Update"]

export class HackathonsRepository extends BaseRepository<Hackathon> {
  constructor() {
    super("hackathons")
  }

  async findPublic(): Promise<Hackathon[]> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("hackathons")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })

    return (data as Hackathon[]) || []
  }

  async findByCreator(creatorId: string): Promise<Hackathon[]> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("hackathons")
      .select("*")
      .eq("created_by", creatorId)
      .order("created_at", { ascending: false })

    return (data as Hackathon[]) || []
  }

  async findAllWithCounts(): Promise<(Hackathon & {
    team_count: number
    project_count: number
  })[]> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("hackathons")
      .select(`
        *,
        teams(count),
        projects(count)
      `)
      .order("created_at", { ascending: false })

    return (data || []).map((hackathon: any) => ({
      ...hackathon,
      team_count: hackathon.teams?.[0]?.count || 0,
      project_count: hackathon.projects?.[0]?.count || 0
    }))
  }

  async findByIdWithDetails(id: string): Promise<Hackathon & {
    categories: any[]
    rubric_criteria: any[]
    timeline_events: any[]
    problem_statements: any[]
    team_count: number
    project_count: number
  } | null> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("hackathons")
      .select(`
        *,
        categories (*),
        rubric_criteria (*),
        timeline_events (*),
        problem_statements (*),
        teams(count),
        projects(count)
      `)
      .eq("id", id)
      .single()

    if (!data) return null

    return {
      ...data,
      team_count: data.teams?.[0]?.count || 0,
      project_count: data.projects?.[0]?.count || 0
    } as any
  }
}
