"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase-server"
import { loginSchema, signupSchema } from "../schemas"
import { AUTH_ROUTES, PROTECTED_ROUTES } from "../constants"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"

export async function loginAction(prevState: { error: string }, formData: FormData): Promise<{ error: string }> {
  console.log("========== loginAction START ==========")
  console.log("loginAction: Form data received")
  
  const supabase = await createClient()

  const validatedFields = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validatedFields.success) {
    console.log("loginAction: Validation failed")
    console.log("========== loginAction END (VALIDATION ERROR) ==========")
    return { error: "Invalid email or password" }
  }

  const { email, password } = validatedFields.data
  console.log("loginAction: Attempting login for email:", email)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.log("loginAction: Supabase error:", error.message)
    console.log("loginAction: Error code:", error.code)
    console.log("========== loginAction END (SUPABASE ERROR) ==========")
    return { error: "Invalid email or password" }
  }

  console.log("loginAction: Success! User:", data.user?.id)
  console.log("loginAction: Session:", data.session ? "exists" : "no")
  console.log("loginAction: Redirecting to dashboard")
  console.log("========== loginAction END (SUCCESS) ==========")
  revalidatePath("/", "layout")
  redirect(PROTECTED_ROUTES.DASHBOARD)
}

export async function signupAction(prevState: { error: string }, formData: FormData): Promise<{ error: string }> {
  console.log("========== signupAction START ==========")
  console.log("signupAction: Form data received")
  
  const supabase = await createClient()

  const validatedFields = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validatedFields.success) {
    console.log("signupAction: Validation failed")
    console.log("========== signupAction END (VALIDATION ERROR) ==========")
    return { error: "Please check your inputs and try again" }
  }

  const { fullName, email, password } = validatedFields.data
  console.log("signupAction: Attempting signup for email:", email)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    console.log("signupAction: Supabase error:", error.message)
    console.log("signupAction: Error code:", error.code)
    console.log("========== signupAction END (SUPABASE ERROR) ==========")
    return { error: error.message }
  }

  console.log("signupAction: Success! User:", data.user?.id)
  console.log("signupAction: Session:", data.session ? "exists" : "no")
  console.log("signupAction: Redirecting to dashboard")
  console.log("========== signupAction END (SUCCESS) ==========")
  revalidatePath("/", "layout")
  redirect(PROTECTED_ROUTES.DASHBOARD)
}

export async function logoutAction() {
  console.log("========== logoutAction START ==========")
  const supabase = await createClient()
  
  console.log("logoutAction: Calling signOut")
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.log("logoutAction: Supabase error:", error.message)
  } else {
    console.log("logoutAction: SignOut successful")
  }
  
  revalidatePath("/", "layout")
  console.log("logoutAction: Redirecting to login")
  console.log("========== logoutAction END ==========")
  redirect(AUTH_ROUTES.LOGIN)
}

export async function updateProfileAction(prevState: { success?: boolean; error?: string }, formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect(AUTH_ROUTES.LOGIN)
  }
  
  const fullName = formData.get("fullName") as string
  
  try {
    const profilesRepo = new ProfilesRepository()
    await profilesRepo.updateProfile(user.id, { full_name: fullName || null })
    
    revalidatePath("/dashboard/settings")
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Failed to update profile" }
  }
}
