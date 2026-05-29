
"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase-server"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"

export async function updateUserRoleAction(prevState: { success?: boolean; error?: string }, formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }
  
  const profilesRepo = new ProfilesRepository()
  const currentUserProfile = await profilesRepo.findByUserId(user.id)
  
  if (!currentUserProfile || currentUserProfile.role !== "admin") {
    redirect("/dashboard")
  }
  
  const userId = formData.get("userId") as string
  const role = formData.get("role") as string
  
  if (!userId || !role) {
    return { error: "User ID and role are required" }
  }
  
  if (!["admin", "team", "judge"].includes(role)) {
    return { error: "Invalid role" }
  }

  // Prevent admin from removing their own admin role
  if (userId === user.id && role !== "admin") {
    const allProfiles = await profilesRepo.findAll()
    const adminCount = allProfiles.filter(p => p.role === "admin").length
    
    if (adminCount <= 1) {
      return { error: "You cannot remove your own admin role because you are the only admin" }
    }
  }
  
  try {
    await profilesRepo.updateRole(userId, role as any)
    revalidatePath("/dashboard/admin/users")
    revalidatePath("/dashboard/admin/judges")
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Failed to update user role" }
  }
}

export async function deleteUserAction(prevState: { success?: boolean; error?: string }, formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }
  
  const profilesRepo = new ProfilesRepository()
  const currentUserProfile = await profilesRepo.findByUserId(user.id)
  
  if (!currentUserProfile || currentUserProfile.role !== "admin") {
    redirect("/dashboard")
  }
  
  const userId = formData.get("userId") as string
  
  if (!userId) {
    return { error: "User ID is required" }
  }
  
  // Prevent admin from deleting themselves
  if (userId === user.id) {
    return { error: "You cannot delete your own account" }
  }
  
  try {
    const deleted = await profilesRepo.delete(userId)
    if (!deleted) {
      return { error: "Failed to delete user" }
    }
    revalidatePath("/dashboard/admin/users")
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Failed to delete user" }
  }
}

