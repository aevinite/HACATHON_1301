
"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase-server"
import { TeamsRepository } from "@/data/repositories/teams-repository"
import { HackathonsRepository } from "@/data/repositories/hackathons-repository"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"
import { isHackathonRegistrationOpen } from "@/lib/format-hackathon-status"


type JoinActionState = { error?: string; teamId?: string; hackathonId?: string; isNewTeam?: boolean }

export async function joinHackathonAction(prevState: JoinActionState, formData: FormData): Promise<JoinActionState> {

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  const hackathonId = formData.get("hackathon_id") as string
  const teamName = formData.get("team_name") as string
  
  if (!hackathonId) {
    return { error: "Hackathon ID is required" }
  }

  const hackathonsRepo = new HackathonsRepository()
  const teamsRepo = new TeamsRepository()
  const profilesRepo = new ProfilesRepository()
  
  try {
    const hackathon = await hackathonsRepo.findById(hackathonId)
    if (!hackathon) {
      return { error: "Hackathon not found" }
    }

    if (!isHackathonRegistrationOpen(hackathon)) {
      return { error: "Registration is closed" }
    }

    // Check if user already has a team for this hackathon
    const existingTeam = await teamsRepo.findByHackathonAndUserId(hackathonId, user.id)
    if (existingTeam) {
      revalidatePath(`/dashboard/hackathons/${hackathonId}")
      return { teamId: existingTeam.id, hackathonId, isNewTeam: false }
    }

    // Get user's profile for default team name if none provided
    const userProfile = await profilesRepo.findByUserId(user.id)
    const finalTeamName = teamName || (userProfile?.full_name ? `${userProfile.full_name}'s Team` : `Team ${user.id.slice(0, 8)}`)

    // Create a new team for the user
    const createdTeam = await teamsRepo.createWithMember(
      {
        name: finalTeamName,
        hackathon_id: hackathonId,
        leader_id: user.id,
        is_active: true,
      },
      user.id
    )

    // Add additional team members
    const supabaseClient = await createClient()
    const memberCount = parseInt(formData.get("member_count") as string || "1")
    
    for (let i = 0; i < memberCount - 1; i++) { // minus 1 for current user
      const memberId = formData.get(`member_id_${i}") as string
      const memberEmail = formData.get(`member_email_${i}") as string
      
      if (memberId) {
        // If we have a member ID (user is registered)
        await supabaseClient
          .from("team_members")
          .insert({
            team_id: createdTeam.id,
            user_id: memberId,
          })
          .then()
          .catch(error => console.error("Error adding team member:", error))
      } else if (memberEmail) {
        // If we only have an email, try to find the profile by email
        const { data: existingProfiles } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("email", memberEmail)
          .limit(1)
        
        if (existingProfiles && existingProfiles.length > 0) {
          await supabaseClient
            .from("team_members")
            .insert({
              team_id: createdTeam.id,
              user_id: existingProfiles[0].id,
            })
        }
      }
    }

    revalidatePath(`/dashboard/hackathons/${hackathonId}")
    return { teamId: createdTeam.id, hackathonId, isNewTeam: true }
  } catch (error) {
    console.error("Failed to join hackathon:", error)
    return { error: "Failed to join hackathon" }
  }
}
