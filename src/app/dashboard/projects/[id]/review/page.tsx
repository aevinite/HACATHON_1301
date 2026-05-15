
import { notFound } from "next/navigation"
import { ProjectsRepository } from "@/data/repositories/projects-repository"
import { ScoresRepository } from "@/data/repositories/scores-repository"
import { RubricCriteriaRepository } from "@/data/repositories/rubric-criteria-repository"
import { JudgesRepository } from "@/data/repositories/judges-repository"
import { getCurrentProfile, getCurrentUser } from "@/features/auth/server/session"
import ReviewPageClient from "./review-page-client"

type ReviewPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ReviewPage({ params, searchParams }: ReviewPageProps) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const user = await getCurrentUser()
  const profile = await getCurrentProfile()

  if (!user || !profile) {
    notFound()
  }

  if (profile.role !== "judge" && profile.role !== "admin") {
    notFound()
  }

  const projectsRepo = new ProjectsRepository()
  const project = await projectsRepo.findById(id)

  if (!project) {
    notFound()
  }

  if (profile.role === "judge") {
    const judgesRepo = new JudgesRepository()
    const judgeAssignments = await judgesRepo.findByUserId(user.id)
    const isAssigned = judgeAssignments.some(a => a.hackathon_id === project.hackathon_id)
    
    if (!isAssigned) {
      notFound()
    }
  }

  const projectsWithDetails = await projectsRepo.findAllWithDetails()
  const projectWithDetails = projectsWithDetails.find(p => p.id === id)

  const scoresRepo = new ScoresRepository()
  const existingScore = await scoresRepo.findByJudgeAndProject(user.id, id)

  const rubricRepo = new RubricCriteriaRepository()
  const rubricCriteria = await rubricRepo.findByHackathonId(project.hackathon_id)

  const getSafeReturnTo = (returnTo: string | string[] | undefined): string => {
    if (typeof returnTo !== "string") return "/dashboard"
    if (returnTo.startsWith("/dashboard")) return returnTo
    return "/dashboard"
  }

  const getSafeReturnLabel = (returnLabel: string | string[] | undefined): string => {
    if (typeof returnLabel !== "string") return "Back"
    return returnLabel
  }

  const returnTo = getSafeReturnTo(resolvedSearchParams.returnTo)
  const returnLabel = getSafeReturnLabel(resolvedSearchParams.returnLabel)

  return (
    <ReviewPageClient
      project={projectWithDetails || project}
      existingScore={existingScore}
      rubricCriteria={rubricCriteria}
      returnTo={returnTo}
      returnLabel={returnLabel}
    />
  )
}
