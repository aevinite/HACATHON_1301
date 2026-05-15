import { createClient } from "@/lib/supabase-server"

export interface LeaderboardEntry {
  id: string
  hackathon_id: string
  name: string
  tagline: string
  team_id: string
  average_score: number | null
  total_judged: number
  team_name: string
  rank: number
}

export async function getLeaderboard(
  hackathonId: string,
  limit = 20,
  offset = 0
): Promise<{ entries: LeaderboardEntry[]; total: number }> {
  const supabase = await createClient()

  const { data, count } = await supabase
    .from("leaderboard")
    .select("*", { count: "exact" })
    .eq("hackathon_id", hackathonId)
    .order("rank", { ascending: true })
    .range(offset, offset + limit - 1)

  return {
    entries: (data as LeaderboardEntry[]) || [],
    total: count || 0,
  }
}

export async function refreshLeaderboard() {
  const supabase = await createClient()
  await supabase.rpc("refresh_leaderboard")
}
