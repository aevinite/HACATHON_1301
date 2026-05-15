
import { BaseRepository } from "./base-repository"
import type { Database } from "@/types/supabase"

type Judge = Database["public"]["Tables"]["judges"]["Row"]
type Hackathon = Database["public"]["Tables"]["hackathons"]["Row"]
type JudgeInsert = Database["public"]["Tables"]["judges"]["Insert"]

type JudgeWithDetails = Judge & {
  hackathons: Hackathon | null
}

export class JudgesRepository extends BaseRepository<Judge> {
  constructor() {
    super("judges")
  }

  async findAllWithDetails(): Promise<JudgeWithDetails[]> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("judges")
      .select(`
        *,
        hackathons (*)
      `)
      .order("created_at", { ascending: false })

    return (data as any[]) || []
  }

  async findByHackathonId(hackathonId: string): Promise<JudgeWithDetails[]> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("judges")
      .select(`
        *,
        hackathons (*)
      `)
      .eq("hackathon_id", hackathonId)
      .order("created_at", { ascending: false })

    return (data as any[]) || []
  }

  async findByUserId(userId: string): Promise<JudgeWithDetails[]> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("judges")
      .select(`
        *,
        hackathons (*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    return (data as any[]) || []
  }

  async findByUserIdAndHackathonId(userId: string, hackathonId: string): Promise<Judge | null> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("judges")
      .select("*")
      .eq("user_id", userId)
      .eq("hackathon_id", hackathonId)
      .single()

    return data
  }

  async assignJudgeToHackathon(judge: JudgeInsert): Promise<Judge> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from("judges")
      .insert(judge)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }
    return data
  }

  async unassignJudgeFromHackathon(judgeAssignmentId: string): Promise<void> {
    const supabase = await this.getClient()
    const { error } = await supabase
      .from("judges")
      .delete()
      .eq("id", judgeAssignmentId)

    if (error) {
      throw new Error(error.message)
    }
  }
}

