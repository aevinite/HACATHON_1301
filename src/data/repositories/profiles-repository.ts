
import { BaseRepository } from "./base-repository"
import type { Database } from "@/types/supabase"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]

export class ProfilesRepository extends BaseRepository<Profile> {
  constructor() {
    super("profiles")
  }

  async findAvailableForHackathon(hackathonId: string, excludeUserId: string): Promise<Profile[]> {
    const supabase = await this.getClient()
    
    // First get all users that are already in teams for this hackathon
    const { data: teams } = await supabase
      .from("teams")
      .select("id")
      .eq("hackathon_id", hackathonId)
    
    const teamIds = teams?.map(t => t.id) || []
    
    // Get all users that are already in any of these teams
    let occupiedUserIds: string[] = []
    if (teamIds.length > 0) {
      const { data: teamMembers } = await supabase
        .from("team_members")
        .select("user_id")
        .in("team_id", teamIds)
      
      occupiedUserIds = teamMembers?.map(tm => tm.user_id) || []
    }
    
    // Also exclude the current user
    occupiedUserIds.push(excludeUserId)
    
    // Get all profiles except those in occupiedUserIds and only team role
    let query = supabase
      .from("profiles")
      .select("*")
      .eq("role", "team")
    
    if (occupiedUserIds.length > 0) {
      query = query.not("id", "in", `(${occupiedUserIds.join(',')})`)
    }
    
    const { data } = await query
      .order("created_at", { ascending: false })

    return (data as Profile[]) || []
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    return data
  }

  async findAllJudges(): Promise<Profile[]> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "judge")
      .order("created_at", { ascending: false })

    return (data as Profile[]) || []
  }

  async findAll(): Promise<Profile[]> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    return (data as Profile[]) || []
  }

  async updateRole(userId: string, role: Profile["role"]): Promise<Profile | null> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("profiles")
      .update({ role } as ProfileUpdate)
      .eq("id", userId)
      .select("*")
      .maybeSingle()

    return data
  }

  async updateProfile(userId: string, data: { full_name?: string | null }): Promise<Profile | null> {
    const supabase = await this.getClient()
    const { data: profile } = await supabase
      .from("profiles")
      .update(data as ProfileUpdate)
      .eq("id", userId)
      .select("*")
      .maybeSingle()

    return profile
  }

  async searchByEmail(query: string, excludeUserId?: string): Promise<Profile[]> {
    const supabase = await this.getClient()
    let dbQuery = supabase
      .from("profiles")
      .select("*")
      .eq("role", "team")

    if (excludeUserId) {
      dbQuery = dbQuery.neq("id", excludeUserId)
    }

    const { data } = await dbQuery
      .limit(50)
      .order("created_at", { ascending: false })

    return (data as Profile[]) || []
  }

  async deleteWithAuth(userId: string): Promise<boolean> {
    // First delete the profile
    const profileDeleted = await this.delete(userId)
    if (!profileDeleted) {
      return false
    }

    // Now delete the auth user using service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
      })
      
      return response.ok
    } catch (error) {
      console.error("Error deleting auth user:", error)
      // If auth deletion fails, we still count it as success since profile is already gone
      return true
    }
  }
}

