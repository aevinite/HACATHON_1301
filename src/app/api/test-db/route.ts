
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { createServiceRoleClient } from "@/lib/supabase-service-role"

export async function GET() {
  const results: Record<string, any> = {}

  // Add Supabase URL
  results.supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL || null

  const supabase = await createClient()
  const serviceSupabase = createServiceRoleClient()

  // Test profiles table
  try {
    const { data, count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact" })
    results.profiles = { success: !error, count, data, error: error?.message || null }
  } catch (e: any) {
    results.profiles = { success: false, error: e.message }
  }

  // Test hackathons table
  try {
    const { data, count, error } = await supabase
      .from("hackathons")
      .select("*", { count: "exact" })
    results.hackathons = { success: !error, count, data, error: error?.message || null }
  } catch (e: any) {
    results.hackathons = { success: false, error: e.message }
  }

  // Test teams table
  try {
    const { data, count, error } = await supabase
      .from("teams")
      .select("*", { count: "exact" })
    results.teams = { success: !error, count, data, error: error?.message || null }
  } catch (e: any) {
    results.teams = { success: false, error: e.message }
  }

  // Test projects table
  try {
    const { count, error } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
    results.projects = { success: !error, count, error: error?.message || null }
  } catch (e: any) {
    results.projects = { success: false, error: e.message }
  }

  // Test scores table
  try {
    const { count, error } = await supabase
      .from("scores")
      .select("*", { count: "exact", head: true })
    results.scores = { success: !error, count, error: error?.message || null }
  } catch (e: any) {
    results.scores = { success: false, error: e.message }
  }

  // Test team members table
  try {
    const { data, error } = await supabase
      .from("team_members")
      .select("*, profiles(*)")
    results.team_members = { success: !error, data, error: error?.message || null }
  } catch (e: any) {
    results.team_members = { success: false, error: e.message }
  }

  // Test auth users
  try {
    const { data: authUsers } = await serviceSupabase.auth.admin.listUsers()
    results.auth_users = { success: true, count: authUsers.users.length, data: authUsers.users }
  } catch (e: any) {
    results.auth_users = { success: false, error: e.message }
  }

  return NextResponse.json(results)
}
