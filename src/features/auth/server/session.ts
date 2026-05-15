"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { AUTH_ROUTES, PROTECTED_ROUTES } from "../constants"

export async function getCurrentUser() {
  console.log("========== getCurrentUser() START ==========")
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  console.log("getCurrentUser():", { user: user?.id || null, error: error?.message || null })
  console.log("========== getCurrentUser() END ==========")
  return user
}

export async function getCurrentProfile() {
  console.log("========== getCurrentProfile() START ==========")
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (!user) {
    console.log("getCurrentProfile(): No user found")
    console.log("========== getCurrentProfile() END ==========")
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  console.log("getCurrentProfile():", { 
    user: user.id, 
    profile: profile?.id || null, 
    error: profileError?.message || null 
  })
  console.log("========== getCurrentProfile() END ==========")
  return profile
}

export async function requireAuth() {
  console.log("========== requireAuth() START ==========")
  const user = await getCurrentUser()
  if (!user) {
    console.log("requireAuth(): No user, redirecting to login")
    console.log("========== requireAuth() END (REDIRECT) ==========")
    redirect(AUTH_ROUTES.LOGIN)
  }
  console.log("requireAuth(): User found:", user.id)
  console.log("========== requireAuth() END ==========")
  return user
}

export async function requireGuest() {
  console.log("========== requireGuest() START ==========")
  const user = await getCurrentUser()
  if (user) {
    console.log("requireGuest(): User found, redirecting to dashboard")
    console.log("========== requireGuest() END (REDIRECT) ==========")
    redirect(PROTECTED_ROUTES.DASHBOARD)
  }
  console.log("requireGuest(): No user found")
  console.log("========== requireGuest() END ==========")
}
