
import { NextResponse } from "next/server"
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

    const lowerQuery = query.toLowerCase().trim()
    const serviceSupabase = createServiceRoleClient()

    // 1. Get ALL auth users first
    console.log("search-profiles: Fetching all auth users")
    const { data: authUsersData } = await serviceSupabase.auth.admin.listUsers()
    const authUsers = authUsersData.users
    console.log("search-profiles: Total auth users:", authUsers.length)

    // 2. Get ALL profiles
    console.log("search-profiles: Fetching all profiles")
    const { data: allProfiles, error: profilesError } = await serviceSupabase
      .from("profiles")
      .select("*")

    if (profilesError) {
      console.error("search-profiles: Error fetching profiles:", profilesError)
    }

    // 3. Create a map of profiles by ID for quick lookup
    const profileMap = new Map()
    allProfiles?.forEach(profile => {
      profileMap.set(profile.id, profile)
    })
    console.log("search-profiles: Profiles in database:", allProfiles?.length || 0)

    // 4. Filter auth users to find matches
    const results = authUsers
      .filter(authUser => {
        // Skip current user
        if (authUser.id === user.id) return false

        const email = authUser.email?.toLowerCase()
        const profile = profileMap.get(authUser.id)
        const fullName = profile?.full_name?.toLowerCase() || authUser.user_metadata?.full_name?.toLowerCase() || authUser.user_metadata?.name?.toLowerCase()

        // Check if email or name matches
        const emailMatch = email?.includes(lowerQuery)
        const nameMatch = fullName?.includes(lowerQuery)

        console.log(`search-profiles: Checking user ${authUser.email} - emailMatch: ${emailMatch}, nameMatch: ${nameMatch}`)

        return emailMatch || nameMatch
      })
      .slice(0, 10)
      .map(authUser => {
        const profile = profileMap.get(authUser.id)
        return {
          id: authUser.id,
          full_name: profile?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
          avatar_url: profile?.avatar_url || null,
          role: profile?.role || "team",
          email: authUser.email,
          is_active: profile?.is_active ?? true
        }
      })

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

