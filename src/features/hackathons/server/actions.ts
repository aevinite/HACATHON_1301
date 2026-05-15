
"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase-server"
import { HackathonsRepository } from "@/data/repositories/hackathons-repository"
import { JudgesRepository } from "@/data/repositories/judges-repository"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"

interface FormState {
  success?: boolean
  fieldErrors?: Record<string, string>
  formError?: string
  values?: Record<string, string | null>
}

function getFormValues(formData: FormData): Record<string, string | null> {
  const values: Record<string, string | null> = {}
  formData.forEach((value, key) => {
    values[key] = typeof value === "string" ? value : null
  })
  return values
}

export async function createHackathonAction(prevState: FormState, formData: FormData): Promise<FormState> {
  console.log("========== createHackathonAction START ==========")
  
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  console.log("createHackathonAction: User check:", { user: user?.id || "NO USER", userError })
  
  if (!user) {
    console.log("createHackathonAction: No user, redirecting to login")
    console.log("========== createHackathonAction END (NO USER) ==========")
    redirect("/login")
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const startDate = formData.get("start_date") as string
  const submissionDeadline = formData.get("submission_deadline") as string
  const registrationStartDate = formData.get("registration_start_date") as string
  const registrationDeadline = formData.get("registration_deadline") as string
  const judgingDeadline = formData.get("judging_deadline") as string
  const bannerImage = formData.get("banner_image") as string

  console.log("createHackathonAction: Form values:", { name, description, startDate, submissionDeadline, registrationStartDate, registrationDeadline, judgingDeadline, bannerImage })
  
  const fieldErrors: Record<string, string> = {}
  const values = getFormValues(formData)

  if (!name.trim()) {
    fieldErrors.name = "Hackathon name is required"
  }
  if (!description.trim()) {
    fieldErrors.description = "Description is required"
  }

  const dates = {
    registrationStart: registrationStartDate ? new Date(registrationStartDate) : null,
    registrationEnd: registrationDeadline ? new Date(registrationDeadline) : null,
    hackathonStart: startDate ? new Date(startDate) : null,
    submissionEnd: submissionDeadline ? new Date(submissionDeadline) : null,
    judgingEnd: judgingDeadline ? new Date(judgingDeadline) : null,
  }

  if (dates.registrationStart && dates.registrationEnd && dates.registrationStart >= dates.registrationEnd) {
    fieldErrors.registration_deadline = "Registration end must be after registration start"
  }
  if (dates.registrationEnd && dates.hackathonStart && dates.registrationEnd > dates.hackathonStart) {
    fieldErrors.start_date = "Hackathon start must be after registration end"
  }
  if (dates.hackathonStart && dates.submissionEnd && dates.hackathonStart >= dates.submissionEnd) {
    fieldErrors.submission_deadline = "Submissions close must be after hackathon starts"
  }
  if (dates.submissionEnd && dates.judgingEnd && dates.submissionEnd >= dates.judgingEnd) {
    fieldErrors.judging_deadline = "Judging ends must be after submissions close"
  }

  if (Object.keys(fieldErrors).length > 0) {
    console.log("createHackathonAction: Validation failed - field errors:", fieldErrors)
    console.log("========== createHackathonAction END (VALIDATION ERROR) ==========")
    return { fieldErrors, formError: "Please fix the highlighted fields", values }
  }

  const repository = new HackathonsRepository()
  const payload = {
    name,
    description,
    theme: null,
    problem_statement: null,
    status: "draft" as const,
    is_public: true,
    min_team_size: 1,
    max_team_size: 4,
    created_by: user.id,
    start_date: startDate ? new Date(startDate).toISOString() : null,
    submission_deadline: submissionDeadline ? new Date(submissionDeadline).toISOString() : null,
    registration_start_date: registrationStartDate ? new Date(registrationStartDate).toISOString() : null,
    registration_deadline: registrationDeadline ? new Date(registrationDeadline).toISOString() : null,
    judging_deadline: judgingDeadline ? new Date(judgingDeadline).toISOString() : null,
    banner_image: bannerImage || null,
  }
  
  console.log("createHackathonAction: Insert payload:", payload)
  
  let createdHackathon: any = null
  
  try {
    createdHackathon = await repository.create(payload)
    console.log("createHackathonAction: Repository create result:", createdHackathon)
  } catch (error) {
    console.log("createHackathonAction: ERROR:", error)
    console.log("createHackathonAction: Error details:", JSON.stringify(error, null, 2))
    console.log("========== createHackathonAction END (ERROR) ==========")
    const userError = "Hackathon could not be saved because the database schema is missing a field. Please contact admin/developer."
    const devError = error instanceof Error ? `\nDeveloper: ${error.message}` : ""
    return { formError: userError + devError, values }
  }

  console.log("createHackathonAction: Success! Revalidating and redirecting")
  console.log("========== createHackathonAction END (SUCCESS) ==========")
  revalidatePath("/dashboard/hackathons")
  revalidatePath("/dashboard/admin/hackathons")
  redirect(`/dashboard/admin/hackathons/${createdHackathon.id}/edit?returnTo=/dashboard/admin/hackathons&returnLabel=Back%20to%20Manage%20Hackathons&created=1`)
}

export async function updateHackathonAction(prevState: FormState, formData: FormData): Promise<FormState> {
  console.log("========== updateHackathonAction START ==========")
  
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  console.log("updateHackathonAction: User check:", { user: user?.id || "NO USER", userError })
  
  if (!user) {
    console.log("updateHackathonAction: No user, redirecting to login")
    console.log("========== updateHackathonAction END (NO USER) ==========")
    redirect("/login")
  }

  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const status = formData.get("status") as string
  const startDate = formData.get("start_date") as string
  const submissionDeadline = formData.get("submission_deadline") as string
  const registrationStartDate = formData.get("registration_start_date") as string
  const registrationDeadline = formData.get("registration_deadline") as string
  const judgingDeadline = formData.get("judging_deadline") as string
  const minTeamSize = formData.get("min_team_size") as string
  const maxTeamSize = formData.get("max_team_size") as string
  const bannerImage = formData.get("banner_image") as string
  const selectedJudgesJson = formData.get("selectedJudges") as string

  const returnTo = formData.get("returnTo") as string
  const returnLabel = formData.get("returnLabel") as string

  console.log("updateHackathonAction: Form values:", { id, name, description, status, startDate, submissionDeadline, registrationDeadline, judgingDeadline, minTeamSize, maxTeamSize, bannerImage, returnTo, selectedJudgesJson })
  
  const fieldErrors: Record<string, string> = {}
  const values = getFormValues(formData)

  if (!id) {
    fieldErrors.id = "Hackathon ID is required"
  }
  if (!name.trim()) {
    fieldErrors.name = "Hackathon name is required"
  }
  if (!description.trim()) {
    fieldErrors.description = "Description is required"
  }

  const dates = {
    registrationStart: registrationStartDate ? new Date(registrationStartDate) : null,
    registrationEnd: registrationDeadline ? new Date(registrationDeadline) : null,
    hackathonStart: startDate ? new Date(startDate) : null,
    submissionEnd: submissionDeadline ? new Date(submissionDeadline) : null,
    judgingEnd: judgingDeadline ? new Date(judgingDeadline) : null,
  }

  if (dates.registrationStart && dates.registrationEnd && dates.registrationStart >= dates.registrationEnd) {
    fieldErrors.registration_deadline = "Registration end must be after registration start"
  }
  if (dates.registrationEnd && dates.hackathonStart && dates.registrationEnd > dates.hackathonStart) {
    fieldErrors.start_date = "Hackathon start must be after registration end"
  }
  if (dates.hackathonStart && dates.submissionEnd && dates.hackathonStart >= dates.submissionEnd) {
    fieldErrors.submission_deadline = "Submissions close must be after hackathon starts"
  }
  if (dates.submissionEnd && dates.judgingEnd && dates.submissionEnd >= dates.judgingEnd) {
    fieldErrors.judging_deadline = "Judging ends must be after submissions close"
  }

  if (Object.keys(fieldErrors).length > 0) {
    console.log("updateHackathonAction: Validation failed - field errors:", fieldErrors)
    console.log("========== updateHackathonAction END (VALIDATION ERROR) ==========")
    return { fieldErrors, formError: "Please fix the highlighted fields", values }
  }

  const repository = new HackathonsRepository()
  const judgesRepo = new JudgesRepository()
  const profilesRepo = new ProfilesRepository()
  const payload = {
    name,
    description,
    theme: null,
    problem_statement: null,
    status: status as "draft" | "registration" | "submission" | "judging" | "completed",
    start_date: startDate ? new Date(startDate).toISOString() : null,
    submission_deadline: submissionDeadline ? new Date(submissionDeadline).toISOString() : null,
    registration_start_date: registrationStartDate ? new Date(registrationStartDate).toISOString() : null,
    registration_deadline: registrationDeadline ? new Date(registrationDeadline).toISOString() : null,
    judging_deadline: judgingDeadline ? new Date(judgingDeadline).toISOString() : null,
    min_team_size: minTeamSize ? parseInt(minTeamSize) : 1,
    max_team_size: maxTeamSize ? parseInt(maxTeamSize) : 4,
    banner_image: bannerImage || null,
  }
  
  console.log("updateHackathonAction: Update payload:", payload)
  
  try {
    const result = await repository.update(id, payload)
    console.log("updateHackathonAction: Repository update result:", result)

    // Sync judge assignments
    const currentAssignments = await judgesRepo.findByHackathonId(id)
    let selectedJudgeIds: string[] = []
    try {
      selectedJudgeIds = JSON.parse(selectedJudgesJson || "[]")
    } catch {
      selectedJudgeIds = []
    }

    // Remove unselected judges
    for (const assignment of currentAssignments) {
      if (!selectedJudgeIds.includes(assignment.user_id)) {
        await judgesRepo.unassignJudgeFromHackathon(assignment.id)
      }
    }

    // Add newly selected judges
    const currentJudgeUserIds = currentAssignments.map(a => a.user_id)
    for (const userId of selectedJudgeIds) {
      if (!currentJudgeUserIds.includes(userId)) {
        const userProfile = await profilesRepo.findById(userId)
        if (userProfile) {
          const judgeId = `judge-${userId.slice(0, 8)}-${Date.now()}`
          await judgesRepo.assignJudgeToHackathon({
            user_id: userId,
            hackathon_id: id,
            judge_id: judgeId,
            name: userProfile.full_name || "Judge",
            email: "",
            status: "active"
          })
        }
      }
    }

  } catch (error) {
    console.log("updateHackathonAction: ERROR:", error)
    console.log("updateHackathonAction: Error details:", JSON.stringify(error, null, 2))
    console.log("========== updateHackathonAction END (ERROR) ==========")
    const userError = "Hackathon could not be saved because the database schema is missing a field. Please contact admin/developer."
    const devError = error instanceof Error ? `\nDeveloper: ${error.message}` : ""
    return { formError: userError + devError, values }
  }

  console.log("updateHackathonAction: Success! Revalidating and redirecting")
  console.log("========== updateHackathonAction END (SUCCESS) ==========")
  revalidatePath("/dashboard/admin/hackathons")
  revalidatePath(`/dashboard/hackathons/${id}`)
  revalidatePath(`/dashboard/admin/hackathons/${id}/edit`)
  
  const getSafeReturnTo = (rt: string | null | undefined): string => {
    if (typeof rt !== "string") return "/dashboard/admin/hackathons"
    if (rt.startsWith("/dashboard")) return rt
    return "/dashboard/admin/hackathons"
  }
  
  redirect(getSafeReturnTo(returnTo))
}

export async function deleteHackathonAction(prevState: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  console.log("========== deleteHackathonAction START ==========")
  
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  console.log("deleteHackathonAction: User check:", { user: user?.id || "NO USER", userError })
  
  if (!user) {
    console.log("deleteHackathonAction: No user, redirecting to login")
    console.log("========== deleteHackathonAction END (NO USER) ==========")
    redirect("/login")
  }

  const id = formData.get("id") as string

  console.log("deleteHackathonAction: Form values:", { id })
  
  if (!id) {
    console.log("deleteHackathonAction: Validation failed - missing id")
    console.log("========== deleteHackathonAction END (VALIDATION ERROR) ==========")
    return { error: "Hackathon ID is required" }
  }

  const repository = new HackathonsRepository()
  const cleanError = "Could not delete this hackathon because it may already have teams, members, or projects linked to it. Please remove related data first, or keep this hackathon archived instead."
  
  try {
    const success = await repository.delete(id)
    console.log("deleteHackathonAction: Repository delete success:", success)
    
    if (!success) {
      console.log("deleteHackathonAction: Failed to delete - likely related data exists")
      console.log("========== deleteHackathonAction END (DELETE FAILED) ==========")
      return { error: cleanError }
    }
  } catch (error) {
    console.log("deleteHackathonAction: ERROR:", error)
    console.log("deleteHackathonAction: Error details:", JSON.stringify(error, null, 2))
    console.log("========== deleteHackathonAction END (ERROR) ==========")
    return { error: cleanError }
  }

  console.log("deleteHackathonAction: Success! Revalidating and redirecting")
  console.log("========== deleteHackathonAction END (SUCCESS) ==========")
  revalidatePath("/dashboard/admin/hackathons")
  redirect("/dashboard/admin/hackathons")
}
