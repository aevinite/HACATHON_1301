
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    // Fetch all auth users
    let allAuthUsers: any[] = []
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: "GET",
        headers: {
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
      })
      
      if (response.ok) {
        const usersData = await response.json()
        allAuthUsers = usersData.users || []
      }
    } catch (error) {
      console.error("Failed to fetch auth users:", error)
    }
    
    for (let i = 0; i < memberCount - 1; i++) { // minus 1 for current user
      const memberIdKey = "member_id_" + i
      const memberEmailKey = "member_email_" + i
      const memberId = formData.get(memberIdKey) as string
      const memberEmail = formData.get(memberEmailKey) as string
      console.log(`Member ${i}:`, { memberIdKey, memberId, memberEmailKey, memberEmail })
      
      let userIdToAdd = null
      
      if (memberId) {
        userIdToAdd = memberId
      } else if (memberEmail && memberEmail.trim() !== "") {
        // If we only have an email, try to find the profile by email
        console.log(`Looking up profile by email:`, memberEmail)
        
        // Find the auth user first
        const matchingAuthUser = allAuthUsers.find((u: any) => 
          u.email && u.email.toLowerCase() === memberEmail.toLowerCase()
        )
        
        if (matchingAuthUser) {
          // Now check if there's a profile for this user
          const matchingProfile = allProfiles.find(p => p.id === matchingAuthUser.id)
          if (matchingProfile) {
            userIdToAdd = matchingProfile.id
          }
        }
      }
      
      if (userIdToAdd) {
        // If we have a member ID (user is registered)
        try {
          console.log(`Adding member ${i} with user_id:`, userIdToAdd)
          await supabaseClient
            .from("team_members")
            .insert({
              team_id: createdTeam.id,
              user_id: userIdToAdd,
            })
          console.log(`Successfully added member ${i}`)
        } catch (error) {
          console.error("Error adding team member:", error)
        }
      }
    }

    revalidatePath("/dashboard/hackathons/" + hackathonId)
    return { teamId: createdTeam.id, hackathonId, isNewTeam: true }
  } catch (error) {
    console.error("Failed to join hackathon:", error)
    return { error: "Failed to join hackathon" }
  }
}
