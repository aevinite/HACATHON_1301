"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase-server"
import { createServiceRoleClient } from "@/lib/supabase-service-role"
import { loginSchema, signupSchema } from "../schemas"
import { AUTH_ROUTES, PROTECTED_ROUTES } from "../constants"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"

export async function loginAction(prevState: { error: string }, formData: FormData): Promise<{ error: string }> {
  console.log("========== loginAction START ==========")
  console.log("loginAction: Form data received")
  
  const supabase = await createClient()
  const serviceSupabase = createServiceRoleClient()

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

  const { data: { users } } = await serviceSupabase.auth.admin.listUsers()
  const existingUser = users.find(u => u.email === email)
  const isVerified = existingUser?.email_confirmed_at !== null

  if (!isVerified) {
    console.log("loginAction: No verified account for email")
    return { error: "No verified account exists for this email. Please sign up and verify your email." }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.log("loginAction: Supabase error:", error.message)
    console.log("loginAction: Error code:", error.code)
    console.log("========== loginAction END (SUPABASE ERROR) ==========")
    return { error: "Incorrect password." }
  }

  console.log("loginAction: Success! User:", data.user?.id)
  console.log("loginAction: Session:", data.session ? "exists" : "no")
  
  const profilesRepo = new (await import("@/data/repositories/profiles-repository")).ProfilesRepository()
  const profile = await profilesRepo.findByUserId(data.user.id)
  const role = profile?.role || "team"
  
  let redirectUrl: string = PROTECTED_ROUTES.DASHBOARD
  if (role === "admin") {
    redirectUrl = "/dashboard"
  } else if (role === "team") {
    redirectUrl = "/dashboard/hackathons"
  } else if (role === "judge") {
    redirectUrl = "/dashboard"
  }

  console.log("loginAction: Redirecting to:", redirectUrl)
  console.log("========== loginAction END (SUCCESS) ==========")
  revalidatePath("/", "layout")
  redirect(redirectUrl)
}

export async function signupAction(prevState: { error: string }, formData: FormData): Promise<{ error: string }> {
  console.log("========== signupAction START ==========")
  console.log("signupAction: Form data received")
  
  const supabase = await createClient()
  const serviceSupabase = createServiceRoleClient()

  const validatedFields = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validatedFields.success) {
    console.log("signupAction: Validation failed")
    console.log("========== signupAction END (VALIDATION ERROR) ==========")
    const firstError = validatedFields.error.issues[0]
    return { error: firstError.message }
  }

  const { fullName, email, password } = validatedFields.data
  console.log("signupAction: Attempting signup for email:", email)

  const { data: { users } } = await serviceSupabase.auth.admin.listUsers()
  const existingUser = users.find(u => u.email === email)
  const isVerified = existingUser?.email_confirmed_at !== null

  if (existingUser && isVerified) {
    console.log("signupAction: Verified account already exists")
    return { error: "An account with this email already exists. Please sign in instead." }
  }

  if (existingUser && !isVerified) {
    console.log("signupAction: Unverified user found, updating")
    await serviceSupabase.auth.admin.updateUserById(existingUser.id, {
      password,
      user_metadata: {
        full_name: fullName,
      },
    })
    await supabase.auth.resend({
      email,
      type: "signup",
    })
    console.log("signupAction: Redirecting to verify-otp with new OTP")
    revalidatePath("/", "layout")
    redirect(`/verify-otp?email=${encodeURIComponent(email)}&message=new_otp`)
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: undefined,
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
  console.log("signupAction: Redirecting to verify-otp")
  console.log("========== signupAction END (SUCCESS) ==========")
  revalidatePath("/", "layout")
  redirect(`/verify-otp?email=${encodeURIComponent(email)}`)
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

export async function verifyOtpAction(prevState: { success?: boolean; error?: string }, formData: FormData): Promise<{ success?: boolean; error?: string }> {
  console.log("========== verifyOtpAction START ==========")
  const supabase = await createClient()

  const email = formData.get("email") as string
  const rawToken = formData.get("otp") as string
  const token = rawToken?.replace(/\s+/g, "")

  console.log("verifyOtpAction - Email:", email)
  console.log("verifyOtpAction - Token length:", token?.length)
  console.log("verifyOtpAction - OTP type used: signup")

  if (!email || !token) {
    console.log("verifyOtpAction: Missing email or token")
    console.log("========== verifyOtpAction END (MISSING DATA) ==========")
    return { error: "Enter the full verification code from your email." }
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    })

    if (error) {
      console.error("verifyOtp error:", error)
      console.log("========== verifyOtpAction END (SUPABASE ERROR) ==========")
      
      let errorMessage = "Invalid or expired verification code. Please request a new code."
      
      if (error.message?.toLowerCase().includes("invalid")) {
        errorMessage = "Invalid verification code. Please request a new code."
      } else if (error.message?.toLowerCase().includes("expired")) {
        errorMessage = "Verification code expired. Please request a new code."
      } else if (error.message?.toLowerCase().includes("already used")) {
        errorMessage = "This verification code has already been used. Please request a new code."
      }
      
      return { error: errorMessage }
    }

    console.log("verifyOtpAction: OTP verified! User:", data.user?.id)

    // Create profile and user record if not exists
    if (data.user) {
      const profilesRepo = new ProfilesRepository()
      const existingProfile = await profilesRepo.findByUserId(data.user.id)
      const fullName = data.user.user_metadata?.full_name || null
      
      // Create profile
      if (!existingProfile) {
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            full_name: fullName,
            avatar_url: null,
            role: "team",
            is_active: true,
          })
        if (insertError) {
          console.log("verifyOtpAction: Error creating profile:", insertError)
        }
      }
      
      // Create user record
      const { error: userError } = await supabase
        .from("users")
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          signup_source: "email",
        })
        .select()
        .single()
      
      if (userError) {
        console.log("verifyOtpAction: Error creating user record:", userError)
      }
    }

    console.log("verifyOtpAction: Redirecting to dashboard")
    console.log("========== verifyOtpAction END (SUCCESS) ==========")
  } catch (e) {
    // Rethrow Next.js redirect errors
    if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) {
      throw e
    }
    console.error("verifyOtpAction: Error:", e)
    console.log("========== verifyOtpAction END (ERROR) ==========")
    return { error: "Invalid or expired verification code. Please request a new code." }
  }

  revalidatePath("/", "layout")
  redirect(PROTECTED_ROUTES.DASHBOARD)
}

export async function resendOtpAction(prevState: { success?: boolean; error?: string; message?: string }, formData: FormData): Promise<{ success?: boolean; error?: string; message?: string }> {
  console.log("========== resendOtpAction START ==========")
  const supabase = await createClient()

  const email = formData.get("email") as string
  if (!email) {
    console.log("resendOtpAction: Missing email")
    console.log("========== resendOtpAction END (MISSING EMAIL) ==========")
    return { error: "Email is required to resend code" }
  }

  try {
    const { error } = await supabase.auth.resend({
      email,
      type: "signup",
    })

    if (error) {
      console.error("resendOtp error:", error)
      console.log("========== resendOtpAction END (SUPABASE ERROR) ==========")
      return { error: "Failed to resend code. Please try again." }
    }

    console.log("resendOtpAction: OTP resent successfully")
    console.log("========== resendOtpAction END (SUCCESS) ==========")
    return { 
      success: true, 
      message: "New verification code sent. Use the latest code from your email. If you do not receive a new code, wait 60 seconds and check spam." 
    }
  } catch (e) {
    console.error("resendOtpAction: Error:", e)
    console.log("========== resendOtpAction END (ERROR) ==========")
    return { error: "Failed to resend code. Please try again." }
  }
}

export async function forgotPasswordAction(prevState: { success?: boolean; error?: string; message?: string }, formData: FormData): Promise<{ success?: boolean; error?: string; message?: string }> {
  console.log("========== forgotPasswordAction START ==========")
  const supabase = await createClient()
  const serviceSupabase = createServiceRoleClient()

  const email = formData.get("email") as string

  if (!email) {
    return { error: "Email is required" }
  }

  const { data: { users } } = await serviceSupabase.auth.admin.listUsers()
  const existingUser = users.find(u => u.email === email)

  if (!existingUser) {
    console.log("forgotPasswordAction: Email not registered")
    return { error: "This email is not signed up." }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  })

  if (error) {
    console.log("forgotPasswordAction: Supabase error:", error.message)
    return { error: "Failed to send reset email. Please try again." }
  }

  console.log("forgotPasswordAction: Reset email sent")
  console.log("========== forgotPasswordAction END ==========")
  return { success: true, message: "Password reset instructions have been sent to your email." }
}

export async function changePasswordAction(prevState: { success?: boolean; error?: string }, formData: FormData): Promise<{ success?: boolean; error?: string }> {
  console.log("========== changePasswordAction START ==========")
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.log("changePasswordAction: No user logged in")
    redirect(AUTH_ROUTES.LOGIN)
  }
  
  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string
  
  console.log("server currentPassword length:", currentPassword?.length)
  console.log("server newPassword length:", newPassword?.length)
  console.log("server confirmPassword length:", confirmPassword?.length)
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All password fields are required" }
  }
  
  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match" }
  }
  
  if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return { error: "Please choose a valid new password" }
  }
  
  try {
    console.log("changePasswordAction: Verifying current password")
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    })
    
    if (signInError) {
      console.error("changePasswordAction: signInWithPassword error:", signInError)
      if (signInError.message?.includes("Invalid login credentials")) {
        return { error: "Current password is incorrect." }
      }
      if (signInError.message?.includes("No account")) {
        return { error: "Your account does not have a password yet. Use Forgot current password to set one." }
      }
      return { error: "Your account does not have a password yet. Use Forgot current password to set one." }
    }
    
    console.log("changePasswordAction: Current password verified, updating password")
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })
    
    if (updateError) {
      console.error("changePasswordAction: updateUser error:", updateError)
      return { error: updateError.message || "Failed to change password. Please try again." }
    }
    
    console.log("changePasswordAction: Password changed successfully")
    console.log("========== changePasswordAction END (SUCCESS) ==========")
    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (e) {
    console.error("changePasswordAction: Error:", e)
    return { error: "Failed to change password. Please try again." }
  }
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
