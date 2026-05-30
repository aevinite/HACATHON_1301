
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

    // 1. First try to search profiles with the new email column
    console.log("search-profiles: Searching profiles with email column")
    const { data: profilesFromDb, error: profilesError } = await serviceSupabase
      .from("profiles")
      .select("*")
      .neq("id", user.id) // Exclude current user
      .or(`full_name.ilike.%${lowerQuery}%,email.ilike.%${lowerQuery}%`)
      .limit(10)

    if (profilesError) {
      console.error("search-profiles: Error searching profiles:", profilesError)
    }

    if (profilesFromDb && profilesFromDb.length > 0) {
      console.log("search-profiles: Found profiles in database:", profilesFromDb.length)
      console.log("========== search-profiles API END (SUCCESS) ==========")
      return NextResponse.json(profilesFromDb)
    }

    // 2. Fallback: If no profiles found, check auth users (for users without profiles yet)
    console.log("search-profiles: Falling back to auth users search")
    const { data: authUsersData } = await serviceSupabase.auth.admin.listUsers()
    const authUsers = authUsersData.users
    console.log("search-profiles: Found auth users count:", authUsers.length)

    const results = authUsers
      .filter(authUser => 
        authUser.id !== user.id && 
        authUser.email?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 10)
      .map(authUser => ({
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name || null,
        avatar_url: null,
        role: "team",
        email: authUser.email
      }))

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

