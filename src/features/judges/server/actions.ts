
"use server"

import { revalidatePath } from "next/cache"
import { JudgesRepository } from "@/data/repositories/judges-repository"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"
import { HackathonsRepository } from "@/data/repositories/hackathons-repository"
import { getCurrentProfile } from "@/features/auth/server/session"

export async function assignJudgeToHackathon(userId: string, hackathonId: string) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "admin") {
    throw new Error("Unauthorized")
  }

  const judgesRepo = new JudgesRepository()
  const profilesRepo = new ProfilesRepository()
  const hackathonsRepo = new HackathonsRepository()

  const existingAssignment = await judgesRepo.findByUserIdAndHackathonId(userId, hackathonId)
  if (existingAssignment) {
    throw new Error("Judge is already assigned to this hackathon")
  }

  const userProfile = await profilesRepo.findById(userId)
  if (!userProfile) {
    throw new Error("User not found")
  }

  const hackathon = await hackathonsRepo.findById(hackathonId)
  if (!hackathon) {
    throw new Error("Hackathon not found")
  }

  const judgeId = `judge-${userId.slice(0, 8)}-${Date.now()}`

  await judgesRepo.assignJudgeToHackathon({
    user_id: userId,
    hackathon_id: hackathonId,
    judge_id: judgeId,
    name: userProfile.full_name || "Judge",
    email: "",
    status: "active"
  })

  revalidatePath("/dashboard/admin/judges")
  revalidatePath(`/dashboard/admin/hackathons/${hackathonId}/edit`)
}

export async function unassignJudgeFromHackathon(judgeAssignmentId: string, hackathonId?: string) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "admin") {
    throw new Error("Unauthorized")
  }

  const judgesRepo = new JudgesRepository()
  await judgesRepo.unassignJudgeFromHackathon(judgeAssignmentId)

  revalidatePath("/dashboard/admin/judges")
  if (hackathonId) {
    revalidatePath(`/dashboard/admin/hackathons/${hackathonId}/edit`)
  }
}

