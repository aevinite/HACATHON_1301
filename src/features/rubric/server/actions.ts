
"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { RubricCriteriaRepository } from "@/data/repositories/rubric-criteria-repository"
import { getCurrentProfile } from "@/features/auth/server/session"

interface FormState {
  success?: boolean
  formError?: string
}

export async function addRubricCriterionAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  const profile = await getCurrentProfile()

  if (!user || !profile || profile.role !== "admin") {
    redirect("/login")
  }

  const hackathonId = formData.get("hackathonId") as string
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const maxScore = formData.get("maxScore") as string

  if (!hackathonId || !name.trim() || !maxScore) {
    return { success: false, formError: "Name and max score are required" }
  }

  const repository = new RubricCriteriaRepository()
  try {
    await repository.create({
      hackathon_id: hackathonId,
      name: name.trim(),
      description: description.trim() || null,
      max_score: parseInt(maxScore),
      weight: 1,
      sort_order: 0
    })
  } catch (error) {
    return { success: false, formError: "Could not add criterion" }
  }

  revalidatePath(`/dashboard/admin/hackathons/${hackathonId}/edit`)
  revalidatePath(`/dashboard/hackathons/${hackathonId}`)
  return { success: true }
}

export async function deleteRubricCriterionAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  const profile = await getCurrentProfile()

  if (!user || !profile || profile.role !== "admin") {
    redirect("/login")
  }

  const hackathonId = formData.get("hackathonId") as string
  const criterionId = formData.get("criterionId") as string

  if (!hackathonId || !criterionId) {
    return { success: false, formError: "Invalid request" }
  }

  const repository = new RubricCriteriaRepository()
  try {
    await repository.delete(criterionId)
  } catch (error) {
    return { success: false, formError: "Could not delete criterion" }
  }

  revalidatePath(`/dashboard/admin/hackathons/${hackathonId}/edit`)
  revalidatePath(`/dashboard/hackathons/${hackathonId}`)
  return { success: true }
}

