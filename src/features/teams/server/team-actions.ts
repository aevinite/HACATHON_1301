
"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase-server"
import { TeamsRepository } from "@/data/repositories/teams-repository"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"

type TeamActionState = {
  success?: boolean
  error?: string
}

export async function addTeamMemberAction(prevState: TeamActionState, formData: FormData): Promise<TeamActionState> {
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
  const members = await profilesRepo.searchByEmail(memberEmail)

  if (!members || members.length === 0) {
    return { error: "No user found with that email" }
  }

  const newMember = members[0]

  try {
    await supabase
      .from("team_members")
      .insert({
        team_id: teamId,
        user_id: newMember.id,
      })

    revalidatePath(`/dashboard/teams/${teamId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to add member:", error)
    return { error: "Failed to add team member" }
  }
}

export async function removeTeamMemberAction(prevState: TeamActionState, formData: FormData): Promise<TeamActionState> {
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
    await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", memberId)

    revalidatePath(`/dashboard/teams/${teamId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to remove member:", error)
    return { error: "Failed to remove team member" }
  }
}
