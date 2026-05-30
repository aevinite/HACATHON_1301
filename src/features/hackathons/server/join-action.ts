
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

    // Create a new team for the user
    const createdTeam = await teamsRepo.createWithMember(
      {
        name: teamName || "My Team",
        hackathon_id: hackathonId,
        leader_id: user.id,
        is_active: true,
      },
      user.id
    )

    // Add additional team members
    console.log("=== ADDING TEAM MEMBERS ===")
    const memberCountStr = formData.get("member_count") as string
    const memberCount = memberCountStr ? parseInt(memberCountStr) : 1
    console.log("Member count from form:", memberCount)
    
    for (let i = 0; i < memberCount - 1; i++) { // minus 1 for current user
      const memberIdKey = `member_id_${i}`
      const memberId = formData.get(memberIdKey) as string
      console.log(`Member ${i} ID:`, memberId)
      
      if (memberId) {
        console.log(`Adding member ${i} with user_id:`, memberId)
        const { error: addError } = await supabase
          .from("team_members")
          .insert({
            team_id: createdTeam.id,
            user_id: memberId,
          })
        if (addError) {
          console.error("Error adding team member:", addError)
        } else {
          console.log(`Successfully added member ${i}`)
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

