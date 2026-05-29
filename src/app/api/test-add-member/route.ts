
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET() {
  const results: Record&lt;string, any&gt; = {}
  const supabase = await createClient()

  // Get all teams and users
  try {
    const { data: allTeams, error: teamsError } = await supabase.from("teams").select("*")
    results.teams = { data: allTeams, error: teamsError }

    const { data: allProfiles, error: profilesError } = await supabase.from("profiles").select("*")
    results.profiles = { data: allProfiles, error: profilesError }

    const { data: allTeamMembers, error: teamMembersError } = await supabase
      .from("team_members")
      .select("*, profiles(*)")
    results.team_members = { data: allTeamMembers, error: teamMembersError }

    // Test adding first profile to first team (if both exist)
    if (allTeams &amp;&amp; allProfiles &amp;&amp; allTeams.length &gt; 0 &amp;&amp; allProfiles.length &gt; 0) {
      const testTeamId = allTeams[0].id
      const testUserId = allProfiles[0].id

      console.log("Test adding user to team...")
      console.log("testTeamId:", testTeamId)
      console.log("testUserId:", testUserId)

      const { data: insertResult, error: insertError } = await supabase
        .from("team_members")
        .insert({
          team_id: testTeamId,
          user_id: testUserId
        })
        .select()

      results.test_insert = { data: insertResult, error: insertError }

      // Now get updated team members
      const { data: updatedTeamMembers, error: updatedError } = await supabase
        .from("team_members")
        .select("*, profiles(*)")
        .eq("team_id", testTeamId)
      
      results.updated_team_members = { data: updatedTeamMembers, error: updatedError }
    }
  } catch (e: any) {
    results.error = e.message
  }

  return NextResponse.json(results)
}
