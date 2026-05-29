
import { BaseRepository } from "./base-repository"
import type { Database } from "@/types/supabase"

type TeamMember = Database["public"]["Tables"]["team_members"]["Row"]
type TeamMemberInsert = Database["public"]["Tables"]["team_members"]["Insert"]
type Profile = Database["public"]["Tables"]["profiles"]["Row"]

type TeamMemberWithProfile = TeamMember & {
  profiles?: Profile | null
}

export class TeamMembersRepository extends BaseRepository<TeamMember> {
  constructor() {
    super("team_members")
  }

  async findByTeamId(teamId: string): Promise<TeamMemberWithProfile[]> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("team_members")
      .select("*, profiles(*)")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true })

    return data || []
  }
}
