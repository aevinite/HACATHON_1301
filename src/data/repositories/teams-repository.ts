
import { BaseRepository } from "./base-repository"
import type { Database } from "@/types/supabase"

type Team = Database["public"]["Tables"]["teams"]["Row"]
type TeamInsert = Database["public"]["Tables"]["teams"]["Insert"]
type TeamUpdate = Database["public"]["Tables"]["teams"]["Update"]

type TeamMember = Database["public"]["Tables"]["team_members"]["Row"]
type TeamMemberInsert = Database["public"]["Tables"]["team_members"]["Insert"]

type Hackathon = Database["public"]["Tables"]["hackathons"]["Row"]
type Profile = Database["public"]["Tables"]["profiles"]["Row"]

type TeamWithDetails = Team & {
  hackathons: Hackathon | null
  profiles: Profile | null
}

export class TeamsRepository extends BaseRepository<Team> {
  constructor() {
    super("teams")
  }

  async findAllWithDetails(): Promise<TeamWithDetails[]> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("teams")
      .select(`
        *,
        hackathons (*),
        profiles (*)
      `)
      .order("created_at", { ascending: false })

    return (data as any[]) || []
  }

  async findByUserId(userId: string): Promise<Team[]> {
    const supabase = await this.getClient()
    
    // First get all team members for the user
    const { data: memberships } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)

    if (!memberships || memberships.length === 0) {
      return []
    }

    // Then get all those teams
    const teamIds = memberships.map(m => m.team_id)
    const { data: teams } = await supabase
      .from("teams")
      .select("*")
      .in("id", teamIds)
      .order("created_at", { ascending: false })

    return teams || []
  }

  async findByHackathonId(hackathonId: string): Promise<Team[]> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("teams")
      .select("*")
      .eq("hackathon_id", hackathonId)
      .order("created_at", { ascending: false })

    return data || []
  }

  async findByHackathonAndUserId(hackathonId: string, userId: string): Promise<Team | null> {
    const supabase = await this.getClient()
    
    // First get all teams for the hackathon
    const { data: teams } = await supabase
      .from("teams")
      .select("*")
      .eq("hackathon_id", hackathonId)

    if (!teams || teams.length === 0) {
      return null
    }

    // Then check each team's members
    for (const team of teams) {
      const { data: members } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", team.id)
        .eq("user_id", userId)
      
      if (members && members.length > 0) {
        return team
      }
    }

    return null
  }

  async createWithMember(team: Omit<TeamInsert, "id" | "created_at" | "updated_at">, userId: string): Promise<Team> {
    const supabase = await this.getClient()
    
    // Create the team
    const { data: createdTeam, error: teamError } = await supabase
      .from("teams")
      .insert(team)
      .select("*")
      .single()

    if (teamError) throw teamError

    // Add the user as a team member
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({
        team_id: createdTeam.id,
        user_id: userId,
      })

    if (memberError) throw memberError

    return createdTeam
  }
}
