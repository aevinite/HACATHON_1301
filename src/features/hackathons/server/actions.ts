
"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase-server"
import { HackathonsRepository } from "@/data/repositories/hackathons-repository"
import { RubricCriteriaRepository } from "@/data/repositories/rubric-criteria-repository"
import { JudgesRepository } from "@/data/repositories/judges-repository"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"
import { StorageService } from "@/storage/utils/storage-utils"
import { FileValidator } from "@/storage/validators/file-validator"
import { BUCKETS } from "@/storage/constants/buckets"
import { PATH_GENERATORS, getFileExtension } from "@/storage/constants/paths"

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
  const minTeamSize = formData.get("min_team_size") as string
  const maxTeamSize = formData.get("max_team_size") as string
  const rubricCriteriaJson = formData.get("rubric_criteria") as string
  const selectedJudgesJson = formData.get("selected_judges") as string
  let bannerImage = formData.get("banner_image") as string
  const bannerFile = formData.get("banner_file") as File | null
  const problemFile = formData.get("problem_file") as File | null

  console.log("createHackathonAction: Form values:", { name, description, startDate, submissionDeadline, registrationStartDate, registrationDeadline, judgingDeadline, bannerImage, bannerFile: bannerFile?.name })
  
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
  const rubricRepository = new RubricCriteriaRepository()
  const judgesRepo = new JudgesRepository()
  const profilesRepo = new ProfilesRepository()
  const payload = {
    name,
    description,
    theme: null,
    problem_statement: null,
    status: "draft" as const,
    is_public: true,
    min_team_size: minTeamSize ? parseInt(minTeamSize) : 1,
    max_team_size: maxTeamSize ? parseInt(maxTeamSize) : 4,
    created_by: user.id,
    start_date: startDate ? new Date(startDate).toISOString() : null,
    submission_deadline: submissionDeadline ? new Date(submissionDeadline).toISOString() : null,
    registration_start_date: registrationStartDate ? new Date(registrationStartDate).toISOString() : null,
    registration_deadline: registrationDeadline ? new Date(registrationDeadline).toISOString() : null,
    judging_deadline: judgingDeadline ? new Date(judgingDeadline).toISOString() : null,
    banner_image: bannerImage || null,
    results_published: false,
    results_visible_to_judges: false,
    results_visible_to_participants: false,
  }
  
  console.log("createHackathonAction: Insert payload:", payload)
  
  let createdHackathon: any = null
  
  try {
    createdHackathon = await repository.create(payload)
    console.log("createHackathonAction: Repository create result:", createdHackathon)
    
    // Save rubric criteria
    if (rubricCriteriaJson) {
      try {
        const rubricCriteria = JSON.parse(rubricCriteriaJson)
        for (let i = 0; i < rubricCriteria.length; i++) {
          const criterion = rubricCriteria[i]
          await rubricRepository.create({
            hackathon_id: createdHackathon.id,
            name: criterion.name,
            description: criterion.description || null,
            max_score: parseInt(criterion.maxScore),
            weight: 1,
            sort_order: i
          })
        }
      } catch (e) {
        console.log("Error parsing rubric criteria:", e)
      }
    }
    
    // Save selected judges
    if (selectedJudgesJson) {
      try {
        const selectedJudgeIds = JSON.parse(selectedJudgesJson)
        for (const userId of selectedJudgeIds) {
          const userProfile = await profilesRepo.findById(userId)
          if (userProfile) {
            const judgeId = `judge-${userId.slice(0, 8)}-${Date.now()}`
            await judgesRepo.assignJudgeToHackathon({
              user_id: userId,
              hackathon_id: createdHackathon.id,
              judge_id: judgeId,
              name: userProfile.full_name || "Judge",
              email: "",
              status: "active"
            })
          }
        }
      } catch (e) {
        console.log("Error parsing selected judges:", e)
      }
    }
    
    if (bannerFile && bannerFile.size > 0) {
      const validationResult = FileValidator.validate({
        bucket: BUCKETS.PUBLIC.HACKATHON_BANNERS,
        file: bannerFile
      })
      
      if (!validationResult.valid) {
        return { fieldErrors: {}, formError: validationResult.errors.join(", "), values }
      }
      
      const timestamp = Date.now()
      const path = PATH_GENERATORS.hackathonBanner(createdHackathon.id, timestamp)
      const extension = getFileExtension(bannerFile.type)
      const fullPath = `${path}${extension}`
      
      await StorageService.uploadFile(
        BUCKETS.PUBLIC.HACKATHON_BANNERS,
        fullPath,
        bannerFile,
        { contentType: bannerFile.type, upsert: true }
      )
      
      const publicUrl = await StorageService.getPublicUrl(
        BUCKETS.PUBLIC.HACKATHON_BANNERS,
        fullPath
      )
      
      await repository.update(createdHackathon.id, { banner_image: publicUrl })
    }
    
    let problemStatementPath: string | null = null
    if (problemFile && problemFile.size > 0) {
      const validationResult = FileValidator.validate({
        bucket: BUCKETS.PRIVATE.PROBLEM_STATEMENTS,
        file: problemFile
      })
      
      if (!validationResult.valid) {
        return { fieldErrors: {}, formError: validationResult.errors.join(", "), values }
      }
      
      const timestamp = Date.now()
      const path = PATH_GENERATORS.problemStatement(createdHackathon.id, createdHackathon.id, timestamp)
      const extension = getFileExtension(problemFile.type)
      const fullPath = `${path}${extension}`
      
      await StorageService.uploadFile(
        BUCKETS.PRIVATE.PROBLEM_STATEMENTS,
        fullPath,
        problemFile,
        { contentType: problemFile.type, upsert: true }
      )
      
      problemStatementPath = fullPath
      await repository.update(createdHackathon.id, { problem_statement: problemStatementPath })
    }
  } catch (error) {
    console.log("createHackathonAction: ERROR:", error)
    console.log("createHackathonAction: Error details:", JSON.stringify(error, null, 2))
    console.log("========== createHackathonAction END (ERROR) ==========")
    const userError = "Hackathon could not be saved. Please contact admin/developer."
    const devError = error instanceof Error ? `\nDeveloper: ${error.message}` : ""
    return { formError: userError + devError, values }
  }

  console.log("createHackathonAction: Success! Revalidating and redirecting")
  console.log("========== createHackathonAction END (SUCCESS) ==========")
  revalidatePath("/dashboard/hackathons")
  revalidatePath("/dashboard/admin/hackathons")
  revalidatePath("/dashboard")
  redirect("/dashboard")
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
  let bannerImage = formData.get("banner_image") as string
  const bannerFile = formData.get("banner_file") as File | null
  const problemFile = formData.get("problem_file") as File | null
  const selectedJudgesJson = formData.get("selectedJudges") as string

  const returnTo = formData.get("returnTo") as string
  const returnLabel = formData.get("returnLabel") as string

  console.log("updateHackathonAction: Form values:", { id, name, description, status, startDate, submissionDeadline, registrationDeadline, judgingDeadline, minTeamSize, maxTeamSize, bannerImage, bannerFile: bannerFile?.name, returnTo, selectedJudgesJson })
  
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
  
  let finalBannerImage = bannerImage || null
  let finalProblemStatement: string | null = null

  try {
    const existingHackathon = await repository.findById(id)
    
    if (bannerFile && bannerFile.size > 0) {
      const validationResult = FileValidator.validate({
        bucket: BUCKETS.PUBLIC.HACKATHON_BANNERS,
        file: bannerFile
      })
      
      if (!validationResult.valid) {
        return { fieldErrors: {}, formError: validationResult.errors.join(", "), values }
      }
      
      const timestamp = Date.now()
      const path = PATH_GENERATORS.hackathonBanner(id, timestamp)
      const extension = getFileExtension(bannerFile.type)
      const fullPath = `${path}${extension}`
      
      await StorageService.uploadFile(
        BUCKETS.PUBLIC.HACKATHON_BANNERS,
        fullPath,
        bannerFile,
        { contentType: bannerFile.type, upsert: true }
      )
      
      finalBannerImage = await StorageService.getPublicUrl(
        BUCKETS.PUBLIC.HACKATHON_BANNERS,
        fullPath
      )
    } else if (bannerImage) {
      finalBannerImage = bannerImage || null
    } else if (existingHackathon) {
      finalBannerImage = existingHackathon.banner_image
    }

    if (problemFile && problemFile.size > 0) {
      const validationResult = FileValidator.validate({
        bucket: BUCKETS.PRIVATE.PROBLEM_STATEMENTS,
        file: problemFile
      })
      
      if (!validationResult.valid) {
        return { fieldErrors: {}, formError: validationResult.errors.join(", "), values }
      }
      
      const timestamp = Date.now()
      const path = PATH_GENERATORS.problemStatement(id, id, timestamp)
      const extension = getFileExtension(problemFile.type)
      const fullPath = `${path}${extension}`
      
      await StorageService.uploadFile(
        BUCKETS.PRIVATE.PROBLEM_STATEMENTS,
        fullPath,
        problemFile,
        { contentType: problemFile.type, upsert: true }
      )
      
      finalProblemStatement = fullPath
    } else if (existingHackathon) {
      finalProblemStatement = existingHackathon.problem_statement
    }

    const payload = {
      name,
      description,
      theme: null,
      problem_statement: finalProblemStatement,
      status: status as "draft" | "registration" | "submission" | "judging" | "completed",
      start_date: startDate ? new Date(startDate).toISOString() : null,
      submission_deadline: submissionDeadline ? new Date(submissionDeadline).toISOString() : null,
      registration_start_date: registrationStartDate ? new Date(registrationStartDate).toISOString() : null,
      registration_deadline: registrationDeadline ? new Date(registrationDeadline).toISOString() : null,
      judging_deadline: judgingDeadline ? new Date(judgingDeadline).toISOString() : null,
      min_team_size: minTeamSize ? parseInt(minTeamSize) : 1,
      max_team_size: maxTeamSize ? parseInt(maxTeamSize) : 4,
      banner_image: finalBannerImage,
    }
    
    console.log("updateHackathonAction: Update payload:", payload)
    
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
    const userError = "Hackathon could not be saved. Please contact admin/developer."
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

export async function publishResultsToJudgesAction(prevState: { error?: string; success?: boolean }, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  console.log("========== publishResultsToJudgesAction START ==========")
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.log("publishResultsToJudgesAction: No user")
    console.log("========== publishResultsToJudgesAction END (NO USER) ==========")
    redirect("/login")
  }
  
  const profilesRepo = new ProfilesRepository()
  const currentUserProfile = await profilesRepo.findByUserId(user.id)
  
  if (!currentUserProfile || currentUserProfile.role !== "admin") {
    console.log("publishResultsToJudgesAction: Not admin")
    console.log("========== publishResultsToJudgesAction END (NOT ADMIN) ==========")
    redirect("/dashboard")
  }
  
  const hackathonId = formData.get("hackathonId") as string
  
  if (!hackathonId) {
    console.log("publishResultsToJudgesAction: Missing hackathonId")
    console.log("========== publishResultsToJudgesAction END (MISSING ID) ==========")
    return { error: "Hackathon ID is required" }
  }
  
  const repository = new HackathonsRepository()
  const hackathon = await repository.findById(hackathonId)
  
  if (!hackathon) {
    console.log("publishResultsToJudgesAction: Hackathon not found")
    console.log("========== publishResultsToJudgesAction END (NOT FOUND) ==========")
    return { error: "Hackathon not found" }
  }
  
  try {
    await repository.update(hackathonId, {
      results_visible_to_judges: true
    })
    
    revalidatePath("/dashboard/leaderboard")
    revalidatePath("/dashboard/admin/hackathons")
    revalidatePath(`/dashboard/hackathons/${hackathonId}`)
    
    console.log("publishResultsToJudgesAction: Success!")
    console.log("========== publishResultsToJudgesAction END (SUCCESS) ==========")
    return { success: true }
  } catch (error) {
    console.log("publishResultsToJudgesAction: ERROR:", error)
    console.log("========== publishResultsToJudgesAction END (ERROR) ==========")
    return { error: "Failed to publish results to judges" }
  }
}

export async function unpublishResultsFromJudgesAction(prevState: { error?: string; success?: boolean }, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  console.log("========== unpublishResultsFromJudgesAction START ==========")
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.log("unpublishResultsFromJudgesAction: No user")
    console.log("========== unpublishResultsFromJudgesAction END (NO USER) ==========")
    redirect("/login")
  }
  
  const profilesRepo = new ProfilesRepository()
  const currentUserProfile = await profilesRepo.findByUserId(user.id)
  
  if (!currentUserProfile || currentUserProfile.role !== "admin") {
    console.log("unpublishResultsFromJudgesAction: Not admin")
    console.log("========== unpublishResultsFromJudgesAction END (NOT ADMIN) ==========")
    redirect("/dashboard")
  }
  
  const hackathonId = formData.get("hackathonId") as string
  
  if (!hackathonId) {
    console.log("unpublishResultsFromJudgesAction: Missing hackathonId")
    console.log("========== unpublishResultsFromJudgesAction END (MISSING ID) ==========")
    return { error: "Hackathon ID is required" }
  }
  
  const repository = new HackathonsRepository()
  const hackathon = await repository.findById(hackathonId)
  
  if (!hackathon) {
    console.log("unpublishResultsFromJudgesAction: Hackathon not found")
    console.log("========== unpublishResultsFromJudgesAction END (NOT FOUND) ==========")
    return { error: "Hackathon not found" }
  }
  
  try {
    await repository.update(hackathonId, {
      results_visible_to_judges: false
    })
    
    revalidatePath("/dashboard/leaderboard")
    revalidatePath("/dashboard/admin/hackathons")
    revalidatePath(`/dashboard/hackathons/${hackathonId}`)
    
    console.log("unpublishResultsFromJudgesAction: Success!")
    console.log("========== unpublishResultsFromJudgesAction END (SUCCESS) ==========")
    return { success: true }
  } catch (error) {
    console.log("unpublishResultsFromJudgesAction: ERROR:", error)
    console.log("========== unpublishResultsFromJudgesAction END (ERROR) ==========")
    return { error: "Failed to unpublish results from judges" }
  }
}

export async function publishResultsToParticipantsAction(prevState: { error?: string; success?: boolean }, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  console.log("========== publishResultsToParticipantsAction START ==========")
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.log("publishResultsToParticipantsAction: No user")
    console.log("========== publishResultsToParticipantsAction END (NO USER) ==========")
    redirect("/login")
  }
  
  const profilesRepo = new ProfilesRepository()
  const currentUserProfile = await profilesRepo.findByUserId(user.id)
  
  if (!currentUserProfile || currentUserProfile.role !== "admin") {
    console.log("publishResultsToParticipantsAction: Not admin")
    console.log("========== publishResultsToParticipantsAction END (NOT ADMIN) ==========")
    redirect("/dashboard")
  }
  
  const hackathonId = formData.get("hackathonId") as string
  
  if (!hackathonId) {
    console.log("publishResultsToParticipantsAction: Missing hackathonId")
    console.log("========== publishResultsToParticipantsAction END (MISSING ID) ==========")
    return { error: "Hackathon ID is required" }
  }
  
  const repository = new HackathonsRepository()
  const hackathon = await repository.findById(hackathonId)
  
  if (!hackathon) {
    console.log("publishResultsToParticipantsAction: Hackathon not found")
    console.log("========== publishResultsToParticipantsAction END (NOT FOUND) ==========")
    return { error: "Hackathon not found" }
  }
  
  try {
    await repository.update(hackathonId, {
      results_visible_to_judges: true,
      results_visible_to_participants: true
    })
    
    revalidatePath("/dashboard/leaderboard")
    revalidatePath("/dashboard/admin/hackathons")
    revalidatePath(`/dashboard/hackathons/${hackathonId}`)
    
    console.log("publishResultsToParticipantsAction: Success!")
    console.log("========== publishResultsToParticipantsAction END (SUCCESS) ==========")
    return { success: true }
  } catch (error) {
    console.log("publishResultsToParticipantsAction: ERROR:", error)
    console.log("========== publishResultsToParticipantsAction END (ERROR) ==========")
    return { error: "Failed to publish results to participants" }
  }
}

export async function unpublishResultsFromParticipantsAction(prevState: { error?: string; success?: boolean }, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  console.log("========== unpublishResultsFromParticipantsAction START ==========")
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.log("unpublishResultsFromParticipantsAction: No user")
    console.log("========== unpublishResultsFromParticipantsAction END (NO USER) ==========")
    redirect("/login")
  }
  
  const profilesRepo = new ProfilesRepository()
  const currentUserProfile = await profilesRepo.findByUserId(user.id)
  
  if (!currentUserProfile || currentUserProfile.role !== "admin") {
    console.log("unpublishResultsFromParticipantsAction: Not admin")
    console.log("========== unpublishResultsFromParticipantsAction END (NOT ADMIN) ==========")
    redirect("/dashboard")
  }
  
  const hackathonId = formData.get("hackathonId") as string
  
  if (!hackathonId) {
    console.log("unpublishResultsFromParticipantsAction: Missing hackathonId")
    console.log("========== unpublishResultsFromParticipantsAction END (MISSING ID) ==========")
    return { error: "Hackathon ID is required" }
  }
  
  const repository = new HackathonsRepository()
  const hackathon = await repository.findById(hackathonId)
  
  if (!hackathon) {
    console.log("unpublishResultsFromParticipantsAction: Hackathon not found")
    console.log("========== unpublishResultsFromParticipantsAction END (NOT FOUND) ==========")
    return { error: "Hackathon not found" }
  }
  
  try {
    await repository.update(hackathonId, {
      results_visible_to_participants: false
    })
    
    revalidatePath("/dashboard/leaderboard")
    revalidatePath("/dashboard/admin/hackathons")
    revalidatePath(`/dashboard/hackathons/${hackathonId}`)
    
    console.log("unpublishResultsFromParticipantsAction: Success!")
    console.log("========== unpublishResultsFromParticipantsAction END (SUCCESS) ==========")
    return { success: true }
  } catch (error) {
    console.log("unpublishResultsFromParticipantsAction: ERROR:", error)
    console.log("========== unpublishResultsFromParticipantsAction END (ERROR) ==========")
    return { error: "Failed to unpublish results from participants" }
  }
}

export async function updateResultVisibilityAction(prevState: { error?: string; success?: boolean }, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  console.log("========== updateResultVisibilityAction START ==========")
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.log("updateResultVisibilityAction: No user")
    console.log("========== updateResultVisibilityAction END (NO USER) ==========")
    redirect("/login")
  }
  
  const profilesRepo = new ProfilesRepository()
  const currentUserProfile = await profilesRepo.findByUserId(user.id)
  
  if (!currentUserProfile || currentUserProfile.role !== "admin") {
    console.log("updateResultVisibilityAction: Not admin")
    console.log("========== updateResultVisibilityAction END (NOT ADMIN) ==========")
    redirect("/dashboard")
  }
  
  const hackathonId = formData.get("hackathonId") as string
  const visibility = formData.get("visibility") as string
  
  if (!hackathonId || !visibility) {
    console.log("updateResultVisibilityAction: Missing hackathonId or visibility")
    console.log("========== updateResultVisibilityAction END (MISSING DATA) ==========")
    return { error: "Hackathon ID and visibility are required" }
  }
  
  const repository = new HackathonsRepository()
  const hackathon = await repository.findById(hackathonId)
  
  if (!hackathon) {
    console.log("updateResultVisibilityAction: Hackathon not found")
    console.log("========== updateResultVisibilityAction END (NOT FOUND) ==========")
    return { error: "Hackathon not found" }
  }
  
  let updatePayload: any = {}
  
  switch (visibility) {
    case "private":
      updatePayload = {
        results_visible_to_judges: false,
        results_visible_to_participants: false
      }
      break
    case "judges":
      updatePayload = {
        results_visible_to_judges: true,
        results_visible_to_participants: false
      }
      break
    case "published":
      updatePayload = {
        results_visible_to_judges: true,
        results_visible_to_participants: true
      }
      break
    default:
      return { error: "Invalid visibility option" }
  }
  
  try {
    await repository.update(hackathonId, updatePayload)
    
    revalidatePath("/dashboard/leaderboard")
    revalidatePath("/dashboard/admin/hackathons")
    revalidatePath(`/dashboard/hackathons/${hackathonId}`)
    
    console.log("updateResultVisibilityAction: Success!")
    console.log("========== updateResultVisibilityAction END (SUCCESS) ==========")
    return { success: true }
  } catch (error) {
    console.log("updateResultVisibilityAction: ERROR:", error)
    console.log("========== updateResultVisibilityAction END (ERROR) ==========")
    return { error: "Failed to update result visibility" }
  }
}

export async function getProblemStatementSignedUrlAction(
  hackathonId: string
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  console.log("========== getProblemStatementSignedUrlAction START ==========")
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const repository = new HackathonsRepository()
  const hackathon = await repository.findById(hackathonId)
  
  if (!hackathon) {
    console.log("getProblemStatementSignedUrlAction: Hackathon not found")
    console.log("========== getProblemStatementSignedUrlAction END (NOT FOUND) ==========")
    return { success: false, error: "Hackathon not found" }
  }
  
  if (!hackathon.problem_statement) {
    console.log("getProblemStatementSignedUrlAction: No problem statement")
    console.log("========== getProblemStatementSignedUrlAction END (NO STATEMENT) ==========")
    return { success: false, error: "No problem statement available" }
  }
  
  const currentTime = new Date()
  const hackathonStartTime = hackathon.start_date ? new Date(hackathon.start_date) : null
  
  const isAdmin = user ? (await (async () => {
    const profilesRepo = new ProfilesRepository()
    const profile = await profilesRepo.findByUserId(user.id)
    return profile?.role === "admin"
  })()) : false
  
  const isJudge = user ? (await (async () => {
    const judgesRepo = new JudgesRepository()
    const assignments = await judgesRepo.findByHackathonId(hackathonId)
    return assignments.some(a => a.user_id === user.id && a.status === "active")
  })()) : false
  
  if (!isAdmin && !isJudge && (!hackathonStartTime || currentTime < hackathonStartTime)) {
    console.log("getProblemStatementSignedUrlAction: Not allowed yet")
    console.log("========== getProblemStatementSignedUrlAction END (LOCKED) ==========")
    return { success: false, error: "Problem statement will be available when the hackathon starts." }
  }
  
  const signedUrl = await StorageService.getSignedUrl(
    BUCKETS.PRIVATE.PROBLEM_STATEMENTS,
    hackathon.problem_statement,
    3600 // 1 hour
  )
  
  console.log("getProblemStatementSignedUrlAction: Success! Returning signed URL")
  console.log("========== getProblemStatementSignedUrlAction END (SUCCESS) ==========")
  
  return { success: true, url: signedUrl }
}
