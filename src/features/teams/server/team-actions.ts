
"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase-server"
import { TeamsRepository } from "@/data/repositories/teams-repository"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"

type TeamActionState = {
  success?: boolean
  error?: string
}

export async function addTeamMemberAction(
  prevState: TeamActionState, 
  formData: FormData
): Promise&lt;TeamActionState&gt; {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: "You must be logged in" }
  }

  const teamId = formData.get("team_id") as string
  const memberEmail = formData.get("member_email") as string

  if (!teamId || !memberEmail) {
    return { error: "Team ID and email are required" }
  }

  const teamsRepo = new TeamsRepository()
  const team = await teamsRepo.findById(teamId)
  
  if (!team) {
    return { error: "Team not found" }
  }

  if (team.leader_id !== user.id) {
    const profilesRepo = new ProfilesRepository()
    const currentUser = await profilesRepo.findByUserId(user.id)
    if (!currentUser || currentUser.role !== "admin") {
      return { error: "Only team leader or admin can add members" }
    }
  }

  const profilesRepo = new ProfilesRepository()
  const allProfiles = await profilesRepo.findAll()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  let foundUserId = null
  
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
      
      const matchingAuthUser = authUsers.find((u: any) =&gt; 
        u.email &amp;&amp; u.email.toLowerCase() === memberEmail.toLowerCase()
      )
      
      if (matchingAuthUser) {
        const matchingProfile = allProfiles.find(p =&gt; p.id === matchingAuthUser.id)
        if (matchingProfile) {
          foundUserId = matchingProfile.id
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch auth users:", error)
  }
  
  if (!foundUserId) {
    return { error: "No user found with that email" }
  }

  try {
    const { data: insertData, error: insertError } = await supabase
      .from("team_members")
      .insert({
        team_id: teamId,
        user_id: foundUserId,
      })
      .select()
    
    if (insertError) {
      if (insertError.code === '23505') {
        return { error: "This user is already a member of the team" }
      }
      return { error: "Failed to add team member" }
    }

    revalidatePath(`/dashboard/teams/${teamId}`)
    revalidatePath("/dashboard/teams")
    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("Failed to add member:", error)
    return { error: "Failed to add team member" }
  }
}

export async function removeTeamMemberAction(
  prevState: TeamActionState, 
  formData: FormData
): Promise&lt;TeamActionState&gt; {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: "You must be logged in" }
  }

  const teamId = formData.get("team_id") as string
  const memberId = formData.get("member_id") as string

  if (!teamId || !memberId) {
    return { error: "Team ID and member ID are required" }
  }

  const teamsRepo = new TeamsRepository()
  const team = await teamsRepo.findById(teamId)
  
  if (!team) {
    return { error: "Team not found" }
  }

  if (team.leader_id !== user.id) {
    const profilesRepo = new ProfilesRepository()
    const currentUser = await profilesRepo.findByUserId(user.id)
    if (!currentUser || currentUser.role !== "admin") {
      return { error: "Only team leader or admin can remove members" }
    }
  }

  try {
    const { error: deleteError } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", memberId)

    if (deleteError) {
      console.error("Delete error:", deleteError)
      return { error: "Failed to remove team member" }
    }

    revalidatePath(`/dashboard/teams/${teamId}`)
    revalidatePath("/dashboard/teams")
    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("Failed to remove member:", error)
    return { error: "Failed to remove team member" }
  }
}
