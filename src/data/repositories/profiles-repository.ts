
import { BaseRepository } from "./base-repository"
import type { Database } from "@/types/supabase"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

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
}

