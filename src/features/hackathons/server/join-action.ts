
"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase-server"
import { TeamsRepository } from "@/data/repositories/teams-repository"

export async function joinHackathonAction(prevState: { error?: string }, formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  const hackathonId = formData.get("hackathon_id") as string
  if (!hackathonId) {
    return { error: "Hackathon ID is required" }
  }

  const repository = new TeamsRepository()
  
  try {
    // Check if user already has a team for this hackathon
    const existingTeam = await repository.findByHackathonAndUserId(hackathonId, user.id)
    if (existingTeam) {
      revalidatePath(`/dashboard/hackathons/${hackathonId}`)
      return {}
    }

    // Create a new team for the user
    await repository.createWithMember(
      {
        name: `${user.id}'s Team`,
        hackathon_id: hackathonId,
        leader_id: user.id,
        is_active: true,
      },
      user.id
    )

    revalidatePath(`/dashboard/hackathons/${hackathonId}`)
    return {}
  } catch (error) {
    console.error("Failed to join hackathon:", error)
    return { error: "Failed to join hackathon" }
  }
}
