
"use server"

import { revalidatePath } from "next/cache"
import { getCurrentProfile, getCurrentUser } from "@/features/auth/server/session"
import { ScoresRepository } from "@/data/repositories/scores-repository"
import { ProjectsRepository } from "@/data/repositories/projects-repository"
import { JudgesRepository } from "@/data/repositories/judges-repository"

type ActionResult = {
  success: boolean
  message: string
  redirectTo?: string
}

export async function submitScoreAction(projectId: string, totalScore: number, comment?: string | null, returnTo?: string): Promise<ActionResult> {
  console.log("========== submitScoreAction START ==========")
  
  const user = await getCurrentUser()
  const profile = await getCurrentProfile()

  console.log("submitScoreAction - User ID:", user?.id || "null")
  console.log("submitScoreAction - Profile Role:", profile?.role || "null")
  console.log("submitScoreAction - Project ID:", projectId)
  console.log("submitScoreAction - Total Score:", totalScore)
  console.log("submitScoreAction - Comment:", comment || "null")
  console.log("submitScoreAction - returnTo:", returnTo || "null")

  if (!user || !profile) {
    console.log("submitScoreAction - ERROR: Not authenticated")
    return {
      success: false,
      message: "Not authenticated"
    }
  }

  if (profile.role !== "judge" && profile.role !== "admin") {
    console.log("submitScoreAction - ERROR: Not authorized (role:", profile.role, ")")
    return {
      success: false,
      message: "Not authorized to score projects"
    }
  }

  const projectsRepo = new ProjectsRepository()
  const project = await projectsRepo.findById(projectId)
  
  if (!project) {
    console.log("submitScoreAction - ERROR: Project not found")
    return {
      success: false,
      message: "Project not found"
    }
  }

  console.log("submitScoreAction - Found project:", project.id)
  console.log("submitScoreAction - Project hackathon ID:", project.hackathon_id)

  if (profile.role === "judge") {
    const judgesRepo = new JudgesRepository()
    const judgeAssignments = await judgesRepo.findByUserId(user.id)
    const isAssigned = judgeAssignments.some(a => a.hackathon_id === project.hackathon_id)
    
    if (!isAssigned) {
      console.log("submitScoreAction - ERROR: Judge not assigned to this hackathon")
      return {
        success: false,
        message: "You are not assigned to judge this hackathon"
      }
    }
  }

  const scoresRepo = new ScoresRepository()
  
  try {
    console.log("submitScoreAction - Calling createOrUpdateScore...")
    const score = await scoresRepo.createOrUpdateScore({
      project_id: projectId,
      judge_id: user.id,
      hackathon_id: project.hackathon_id,
      total_score: Number(totalScore),
      comment: comment || null,
      is_submitted: true,
    })

    console.log("submitScoreAction - Score created/updated:", score.id)

    const allScores = await scoresRepo.findByProjectId(projectId)
    console.log("submitScoreAction - All scores for project:", allScores.length)
    
    const averageScore = allScores.length > 0 
      ? allScores.reduce((sum, s) => sum + s.total_score, 0) / allScores.length 
      : null

    console.log("submitScoreAction - Calculated average score:", averageScore)

    await projectsRepo.update(projectId, {
      average_score: averageScore,
      total_judged: allScores.length,
    })

    console.log("submitScoreAction - Updated project aggregates")
  } catch (error) {
    console.error("submitScoreAction - ERROR:", error)
    console.error("submitScoreAction - Error details:", JSON.stringify(error, null, 2))
    return {
      success: false,
      message: "Failed to submit score. Please check console for details."
    }
  }

  console.log("========== submitScoreAction END (SUCCESS) ==========")
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/leaderboard")
  revalidatePath(`/dashboard/projects/${projectId}`)
  
  const getSafeRedirectTo = (redirectTo: string | undefined): string => {
    if (typeof redirectTo !== "string") return "/dashboard"
    if (redirectTo.startsWith("/dashboard")) return redirectTo
    return "/dashboard"
  }

  return {
    success: true,
    message: "Score submitted successfully",
    redirectTo: getSafeRedirectTo(returnTo)
  }
}
