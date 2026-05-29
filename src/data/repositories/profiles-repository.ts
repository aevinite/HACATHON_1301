
import { BaseRepository } from "./base-repository"
import type { Database } from "@/types/supabase"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]

export class ProfilesRepository extends BaseRepository<Profile> {
  constructor() {
    super("profiles")
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
      .ilike("email", `%${query}%`)

    if (excludeUserId) {
      dbQuery = dbQuery.neq("id", excludeUserId)
    }

    const { data } = await dbQuery
      .limit(10)
      .order("created_at", { ascending: false })

    return (data as Profile[]) || []
  }
}

