
import { NextResponse } from "next/server"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"
import { createClient } from "@/lib/supabase-server"
import { createServiceRoleClient } from "@/lib/supabase-service-role"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.length < 1) {
      return NextResponse.json([])
    }

    // First, fetch ALL auth users (to get emails)
    const serviceSupabase = createServiceRoleClient()
    const { data: authUsers } = await serviceSupabase.auth.admin.listUsers()

    // Create a map of auth users by id
    const authUsersMap = new Map()
    authUsers.users.forEach(authUser => {
      authUsersMap.set(authUser.id, authUser)
    })

    // Now fetch all team-role profiles (excluding current user)
    const profilesRepo = new ProfilesRepository()
    const profiles = await profilesRepo.searchByEmail(query, user.id)

    // For each profile, add the email, then filter by query
    const results = profiles
      .map(profile => {
        const authUser = authUsersMap.get(profile.id)
        return {
          ...profile,
          email: authUser?.email || null
        }
      })
      .filter(profile => {
        // Check if name OR email matches the query
        const nameMatch = profile.full_name?.toLowerCase().includes(query.toLowerCase())
        const emailMatch = profile.email?.toLowerCase().includes(query.toLowerCase())
        return nameMatch || emailMatch
      })
      .slice(0, 10) // Limit to 10 results

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error searching profiles:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

