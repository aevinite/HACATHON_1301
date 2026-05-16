
"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase-server"
import { TeamsRepository } from "@/data/repositories/teams-repository"
import { TeamMembersRepository } from "@/data/repositories/team-members-repository"
import { HackathonsRepository } from "@/data/repositories/hackathons-repository"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"

export async function updateTeamNameAction(prevState: { error?: string; success?: boolean }, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  const teamId = formData.get("team_id") as string
  const name = formData.get("name") as string

  if (!teamId || !name.trim()) {
    return { error: "Team ID and name are required" }
  }

  const teamsRepo = new TeamsRepository()
  const hackathonsRepo = new HackathonsRepository()
  const profilesRepo = new ProfilesRepository()

  try {
    const team = await teamsRepo.findById(teamId)
    if (!team) {
      return { error: "Team not found" }
    }

    const currentUserProfile = await profilesRepo.findByUserId(user.id)
    const isOwner = team.leader_id === user.id
    const isAdmin = currentUserProfile?.role === "admin"

    if (!isOwner && !isAdmin) {
      return { error: "Only team owner or admin can edit team" }
    }

    const hackathon = await hackathonsRepo.findById(team.hackathon_id)
    if (hackathon?.start_date && new Date() >= new Date(hackathon.start_date)) {
      return { error: "Team locked after hackathon start" }
    }

    await teamsRepo.update(teamId, { name })
    revalidatePath(`/dashboard/teams/${teamId}`)
    revalidatePath("/dashboard/teams")
    revalidatePath(`/dashboard/hackathons/${team.hackathon_id}`)
    return { success: true }
  } catch (e) {
    console.error("Failed to update team name:", e)
    return { error: "Failed to update team name" }
  }
}

export async function addTeamMemberAction(prevState: { error?: string; success?: boolean }, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  const teamId = formData.get("team_id") as string
  const memberUserId = formData.get("member_user_id") as string

  if (!teamId || !memberUserId) {
    return { error: "Team ID and member user ID are required" }
  }

  const teamsRepo = new TeamsRepository()
  const teamMembersRepo = new TeamMembersRepository()
  const hackathonsRepo = new HackathonsRepository()
  const profilesRepo = new ProfilesRepository()

  try {
    const team = await teamsRepo.findById(teamId)
    if (!team) {
      return { error: "Team not found" }
    }

    const currentUserProfile = await profilesRepo.findByUserId(user.id)
    const isOwner = team.leader_id === user.id
    const isAdmin = currentUserProfile?.role === "admin"

    if (!isOwner && !isAdmin) {
      return { error: "Only team owner or admin can add members" }
    }

    const hackathon = await hackathonsRepo.findById(team.hackathon_id)
    if (hackathon?.start_date && new Date() >= new Date(hackathon.start_date)) {
      return { error: "Team locked after hackathon start" }
    }

    const newMemberProfile = await profilesRepo.findByUserId(memberUserId)
    if (!newMemberProfile) {
      return { error: "User not found" }
    }

    if (newMemberProfile.role !== "team") {
      return { error: "Only participants can be added to teams" }
    }

    const currentMembers = await teamMembersRepo.findByTeamId(teamId)
    if (currentMembers.some(m => m.user_id === memberUserId)) {
      return { error: "User is already in this team" }
    }

    const allTeamsForHackathon = await teamsRepo.findByHackathonId(team.hackathon_id)

    for (const t of allTeamsForHackathon) {
      const membersForOtherTeam = await teamMembersRepo.findByTeamId(t.id)
      if (membersForOtherTeam.some(m => m.user_id === memberUserId)) {
        return { error: "User is already in another team for this hackathon" }
      }
    }

    if (hackathon) {
      if (currentMembers.length + 1 > hackathon.max_team_size) {
        return { error: `Max team size is ${hackathon.max_team_size}` }
      }
    }

    await teamMembersRepo.create({ 
      team_id: teamId, 
      user_id: memberUserId,
      role: null,
      joined_at: new Date().toISOString()
    })
    revalidatePath(`/dashboard/teams/${teamId}`)
    revalidatePath("/dashboard/teams")
    revalidatePath(`/dashboard/hackathons/${team.hackathon_id}`)
    return { success: true }
  } catch (e) {
    console.error("Failed to add team member:", e)
    return { error: "Failed to add team member" }
  }
}

export async function removeTeamMemberAction(prevState: { error?: string; success?: boolean }, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  const teamId = formData.get("team_id") as string
  const memberId = formData.get("member_id") as string

  if (!teamId || !memberId) {
    return { error: "Team ID and member ID are required" }
  }

  const teamsRepo = new TeamsRepository()
  const teamMembersRepo = new TeamMembersRepository()
  const hackathonsRepo = new HackathonsRepository()
  const profilesRepo = new ProfilesRepository()

  try {
    const team = await teamsRepo.findById(teamId)
    if (!team) {
      return { error: "Team not found" }
    }

    const currentUserProfile = await profilesRepo.findByUserId(user.id)
    const isOwner = team.leader_id === user.id
    const isAdmin = currentUserProfile?.role === "admin"

    if (!isOwner && !isAdmin) {
      return { error: "Only team owner or admin can remove members" }
    }

    const hackathon = await hackathonsRepo.findById(team.hackathon_id)
    if (hackathon?.start_date && new Date() >= new Date(hackathon.start_date)) {
      return { error: "Team locked after hackathon start" }
    }

    await teamMembersRepo.delete(memberId)
    revalidatePath(`/dashboard/teams/${teamId}`)
    revalidatePath("/dashboard/teams")
    revalidatePath(`/dashboard/hackathons/${team.hackathon_id}`)
    return { success: true }
  } catch (e) {
    console.error("Failed to remove team member:", e)
    return { error: "Failed to remove team member" }
  }
}
