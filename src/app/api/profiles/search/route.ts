
import { NextResponse } from "next/server"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"
import { createClient } from "@/lib/supabase-server"
import { createServiceRoleClient } from "@/lib/supabase-service-role"

export async function GET(request: Request) {
  console.log("========== search-profiles API START ==========")
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log("search-profiles: Not authorized")
      console.log("========== search-profiles API END (UNAUTHORIZED) ==========")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("search-profiles: Current user ID:", user.id)

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    console.log("search-profiles: Search query:", query)

    if (!query || query.length < 1) {
      console.log("search-profiles: No query, returning empty array")
      console.log("========== search-profiles API END (NO QUERY) ==========")
      return NextResponse.json([])
    }

    // First, fetch ALL auth users (to get emails)
    console.log("search-profiles: Fetching auth users")
    const serviceSupabase = createServiceRoleClient()
    const { data: authUsers } = await serviceSupabase.auth.admin.listUsers()
    console.log("search-profiles: Found auth users count:", authUsers.users.length)

    // Create a map of auth users by id
    const authUsersMap = new Map()
    authUsers.users.forEach(authUser => {
      authUsersMap.set(authUser.id, authUser)
    })
    console.log("search-profiles: Auth users map created with keys:", Array.from(authUsersMap.keys()))

    // Now fetch all team-role profiles (excluding current user)
    console.log("search-profiles: Fetching profiles")
    const profilesRepo = new ProfilesRepository()
    const profiles = await profilesRepo.searchByEmail(query, user.id)
    console.log("search-profiles: Found profiles count:", profiles.length)
    console.log("search-profiles: Profiles data:", JSON.stringify(profiles, null, 2))

    // For each profile, add the email, then filter by query
    const results = profiles
      .map(profile => {
        const authUser = authUsersMap.get(profile.id)
        const withEmail = {
          ...profile,
          email: authUser?.email || null
        }
        console.log(`search-profiles: Mapped profile ${profile.id}:`, JSON.stringify(withEmail, null, 2))
        return withEmail
      })
      .filter(profile => {
        // Check if name OR email matches the query
        const nameMatch = profile.full_name?.toLowerCase().includes(query.toLowerCase())
        const emailMatch = profile.email?.toLowerCase().includes(query.toLowerCase())
        console.log(`search-profiles: Filtering profile ${profile.id} - nameMatch: ${nameMatch}, emailMatch: ${emailMatch}`)
        return nameMatch || emailMatch
      })
      .slice(0, 10) // Limit to 10 results

    console.log("search-profiles: Final results count:", results.length)
    console.log("search-profiles: Final results:", JSON.stringify(results, null, 2))
    console.log("========== search-profiles API END (SUCCESS) ==========")

    return NextResponse.json(results)
  } catch (error) {
    console.error("search-profiles: Error searching profiles:", error)
    console.log("========== search-profiles API END (ERROR) ==========")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

