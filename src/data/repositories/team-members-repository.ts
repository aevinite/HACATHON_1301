
import { BaseRepository } from "./base-repository"
import type { Database } from "@/types/supabase"

type TeamMember = Database["public"]["Tables"]["team_members"]["Row"]
type TeamMemberInsert = Database["public"]["Tables"]["team_members"]["Insert"]

export class TeamMembersRepository extends BaseRepository<TeamMember> {
  constructor() {
    super("team_members")
  }

  async findByTeamId(teamId: string): Promise<TeamMember[]> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true })

    return data || []
  }
}
