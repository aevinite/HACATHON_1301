
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
    
    // Get all profiles and auth users first (same as addTeamMemberAction!)
    const allProfiles = await profilesRepo.findAll()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    let foundUserId: string | null = null
    
    for (let i = 0; i < memberCount - 1; i++) { // minus 1 for current user    
      const memberEmailKey = "member_email_" + i
      const memberEmail = formData.get(memberEmailKey) as string
      console.log(`Member ${i} email:`, memberEmail)
      
      foundUserId = null
      
      if (memberEmail && memberEmail.trim() !== "") {
        // Use service role to list all users and find by email (just like addTeamMemberAction!)
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
            const authUsers = usersData.users || []
            
            const matchingAuthUser = authUsers.find((u: any) => 
              u.email && u.email.toLowerCase() === memberEmail.toLowerCase()
            )
            
            if (matchingAuthUser) {
              const matchingProfile = allProfiles.find(p => p.id === matchingAuthUser.id)
              if (matchingProfile) {
                foundUserId = matchingProfile.id
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch auth users:", error)
        }
        
        if (foundUserId) {
          console.log(`Adding member ${i} to team ${createdTeam.id} with user_id:`, foundUserId)
          try {
            await supabaseClient
              .from("team_members")
              .insert({
                team_id: createdTeam.id,
                user_id: foundUserId,
              })
            console.log(`Successfully added member ${i}`)
          } catch (error) {
            console.error("Error adding team member:", error)
          }
        } else {
          console.log(`No user/profile found for email:`, memberEmail)
        }
      }
    }
    
    // Verify team members were added!
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
