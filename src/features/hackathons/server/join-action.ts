
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
      revalidatePath("/dashboard/hackathons/" + hackathonId)
      return { teamId: existingTeam.id, hackathonId, isNewTeam: false }
    }

    // Get user's profile for default team name if none provided
    const userProfile = await profilesRepo.findByUserId(user.id)
    let finalTeamName = teamName
    if (!finalTeamName) {
      if (userProfile?.full_name) {
        finalTeamName = userProfile.full_name + " Team"
      } else {
        finalTeamName = "Team " + user.id.slice(0, 8)
      }
    }

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
    console.log("=== ADDING TEAM MEMBERS ===")
    const supabaseClient = await createClient()
    const memberCountStr = formData.get("member_count") as string
    const memberCount = memberCountStr ? parseInt(memberCountStr) : 1
    console.log("Member count from form:", memberCount)
    
    // Get all profiles and auth users first
    const allProfiles = await profilesRepo.findAll()
    console.log("All profiles in DB:", allProfiles.map(p => ({ id: p.id, email: p.email, full_name: p.full_name })))
    
    // We don't need to fetch auth users - let's just search by email in profiles!
    // We'll also check if profiles have an email field (since some dbs might have email in profiles)
    
    for (let i = 0; i < memberCount - 1; i++) { // minus 1 for current user
      const memberEmailKey = "member_email_" + i
      const memberEmail = formData.get(memberEmailKey) as string
      console.log(`Member ${i} email:`, memberEmail)
      
      if (memberEmail && memberEmail.trim() !== "") {
        // Try to find profile by email
        const matchingProfile = allProfiles.find(p => 
          p.email && p.email.toLowerCase() === memberEmail.toLowerCase()
        )
        
        if (matchingProfile) {
          console.log(`Found profile:`, matchingProfile.id, matchingProfile.email)
          try {
            console.log(`Adding member ${i} to team ${createdTeam.id} with user_id:`, matchingProfile.id)
            await supabaseClient
              .from("team_members")
              .insert({
                team_id: createdTeam.id,
                user_id: matchingProfile.id,
              })
            console.log(`Successfully added member ${i}`)
          } catch (error) {
            console.error("Error adding team member:", error)
          }
        } else {
          console.log(`No profile found for email:`, memberEmail)
        }
      }
    }
    
    // Let's verify the team members were added!
    const verifyMembers = await supabaseClient
      .from("team_members")
      .select("*, profiles(*)")
      .eq("team_id", createdTeam.id)
    console.log("=== VERIFYING TEAM MEMBERS ===")
    console.log("Team members after add:", verifyMembers.data)

    revalidatePath("/dashboard/hackathons/" + hackathonId)
    return { teamId: createdTeam.id, hackathonId, isNewTeam: true }
  } catch (error) {
    console.error("Failed to join hackathon:", error)
    return { error: "Failed to join hackathon" }
  }
}
