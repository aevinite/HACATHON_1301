
"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase-server"
import { TeamsRepository } from "@/data/repositories/teams-repository"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"

type TeamActionState = {
  success?: boolean
  error?: string
}

export async function addTeamMemberAction(prevState: TeamActionState, formData: FormData): Promise&lt;TeamActionState&gt; {
  console.log("========== addTeamMemberAction START ==========")
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  console.log("Current user:", user)
  console.log("User error:", userError)
  
  if (!user) {
    return { error: "You must be logged in" }
  }

  const teamId = formData.get("team_id") as string
  const memberEmail = formData.get("member_email") as string
  console.log("Adding memberEmail:", memberEmail)
  console.log("teamId:", teamId)

  if (!teamId || !memberEmail) {
    return { error: "Team ID and email are required" }
  }

  const teamsRepo = new TeamsRepository()
  const team = await teamsRepo.findById(teamId)
  console.log("Found team:", team)
  
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

  // Get all profiles first and find the matching user
  const profilesRepo = new ProfilesRepository()
  const allProfiles = await profilesRepo.findAll()
  console.log("All profiles in database:", allProfiles.length)
  console.log("All profiles data:", JSON.stringify(allProfiles, null, 2))
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  let foundUserId = null
  
  try {
    // Use service role to list all users and find by email
    console.log("Fetching auth users from Supabase...")
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "GET",
      headers: {
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
    })
    
    console.log("Auth users response status:", response.status)
    
    if (response.ok) {
      const usersData = await response.json()
      const authUsers = usersData.users || []
      console.log("Number of auth users found:", authUsers.length)
      
      // Find the user by email
      const matchingAuthUser = authUsers.find((u: any) =&gt; 
        u.email &amp;&amp; u.email.toLowerCase() === memberEmail.toLowerCase()
      )
      
      console.log("Matching auth user:", matchingAuthUser)
      
      if (matchingAuthUser) {
        // Now check if there's a profile for this user
        const matchingProfile = allProfiles.find(p =&gt; p.id === matchingAuthUser.id)
        console.log("Matching profile in DB:", matchingProfile)
        if (matchingProfile) {
          foundUserId = matchingProfile.id
        } else {
          console.log("No profile found for this auth user!")
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch auth users:", error)
  }
  
  console.log("Final foundUserId:", foundUserId)
  
  if (!foundUserId) {
    console.log("ERROR: No user found with that email!")
    return { error: "No user found with that email" }
  }

  try {
    console.log("About to insert into team_members...")
    const { data: insertData, error: insertError } = await supabase
      .from("team_members")
      .insert({
        team_id: teamId,
        user_id: foundUserId,
      })
      .select()

    console.log("Insert result data:", insertData)
    console.log("Insert error:", insertError)
    
    if (insertError) {
      console.error("Insert error details:", insertError)
      if (insertError.code === '23505') { // Unique violation
        return { error: "This user is already a member of the team" }
      }
      return { error: "Failed to add team member" }
    }

    revalidatePath(`/dashboard/teams/${teamId}`)
    revalidatePath("/dashboard/teams")
    revalidatePath("/dashboard", "layout")
    console.log("Successfully added member and revalidated paths!")
    
    return { success: true }
  } catch (error) {
    console.error("Failed to add member:", error)
    return { error: "Failed to add team member" }
  }
}

export async function removeTeamMemberAction(prevState: TeamActionState, formData: FormData): Promise&lt;TeamActionState&gt; {
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
