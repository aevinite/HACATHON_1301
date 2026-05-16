
"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { AUTH_ROUTES, PROTECTED_ROUTES } from "../constants"

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getCurrentProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  return profile
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect(AUTH_ROUTES.LOGIN)
  }
  return user
}

export async function requireGuest() {
  const user = await getCurrentUser()
  if (user) {
    redirect(PROTECTED_ROUTES.DASHBOARD)
  }
}

