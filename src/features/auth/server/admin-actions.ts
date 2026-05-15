
"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase-server"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"

export async function updateUserRoleAction(prevState: { success?: boolean; error?: string }, formData: FormData): Promise<{ success?: boolean; error?: string }> {
  console.log("========== updateUserRoleAction START ==========")
  
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (!user) {
    console.log("updateUserRoleAction: No user")
    redirect("/login")
  }
  
  const profilesRepo = new ProfilesRepository()
  const currentUserProfile = await profilesRepo.findByUserId(user.id)
  
  if (!currentUserProfile || currentUserProfile.role !== "admin") {
    console.log("updateUserRoleAction: Not admin")
    redirect("/dashboard")
  }
  
  const userId = formData.get("userId") as string
  const role = formData.get("role") as string
  
  console.log("updateUserRoleAction: Params:", { userId, role })
  
  if (!userId || !role) {
    return { error: "User ID and role are required" }
  }
  
  if (!["admin", "team", "judge"].includes(role)) {
    return { error: "Invalid role" }
  }
  
  try {
    const result = await profilesRepo.updateRole(userId, role as any)
    console.log("updateUserRoleAction: Success:", result)
    revalidatePath("/dashboard/admin/users")
    return { success: true }
  } catch (error) {
    console.error("updateUserRoleAction: ERROR:", error)
    return { error: "Failed to update user role" }
  }
}

