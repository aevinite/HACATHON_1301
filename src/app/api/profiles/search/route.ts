
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

    const lowerQuery = query.toLowerCase()
    const serviceSupabase = createServiceRoleClient()

    // 1. Fetch ALL auth users
    console.log("search-profiles: Fetching auth users")
    const { data: authUsersData } = await serviceSupabase.auth.admin.listUsers()
    const authUsers = authUsersData.users
    console.log("search-profiles: Found auth users count:", authUsers.length)

    // 2. Filter auth users by email first
    const matchingAuthUsers = authUsers.filter(authUser => 
      authUser.email?.toLowerCase().includes(lowerQuery)
    )
    console.log("search-profiles: Auth users matching email:", matchingAuthUsers.length)

    // 3. Get matching user IDs
    const matchingUserIds = matchingAuthUsers.map(u => u.id)

    // 4. Fetch all profiles, then filter
    console.log("search-profiles: Fetching all profiles")
    const { data: allProfiles, error: profilesError } = await serviceSupabase
      .from("profiles")
      .select("*")
      .neq("id", user.id) // Exclude current user

    if (profilesError) {
      console.error("search-profiles: Error fetching profiles:", profilesError)
    }
    console.log("search-profiles: All profiles count:", allProfiles?.length || 0)

    // 5. Create a map of profiles by ID
    const profilesById = new Map()
    allProfiles?.forEach(profile => {
      profilesById.set(profile.id, profile)
    })

    // 6. Build results from both sources
    const results = []
    
    // First add users with matching emails (even if no profile)
    for (const authUser of matchingAuthUsers) {
      if (authUser.id === user.id) continue // Skip current user
      
      const profile = profilesById.get(authUser.id)
      results.push({
        id: authUser.id,
        full_name: profile?.full_name || null,
        avatar_url: profile?.avatar_url || null,
        role: profile?.role || "team",
        email: authUser.email
      })
    }

    // Then add users with matching full names from profiles
    if (allProfiles) {
      for (const profile of allProfiles) {
        if (profile.id === user.id) continue
        if (matchingUserIds.includes(profile.id)) continue // Already added
        
        if (profile.full_name?.toLowerCase().includes(lowerQuery)) {
          const authUser = authUsers.find(u => u.id === profile.id)
          results.push({
            ...profile,
            email: authUser?.email || null
          })
        }
      }
    }

    // Limit to 10 results
    const finalResults = results.slice(0, 10)

    console.log("search-profiles: Final results count:", finalResults.length)
    console.log("search-profiles: Final results:", JSON.stringify(finalResults, null, 2))
    console.log("========== search-profiles API END (SUCCESS) ==========")

    return NextResponse.json(finalResults)
  } catch (error) {
    console.error("search-profiles: Error searching profiles:", error)
    console.log("========== search-profiles API END (ERROR) ==========")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

