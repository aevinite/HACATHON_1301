
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

    const profilesRepo = new ProfilesRepository()
    const profiles = await profilesRepo.searchByEmail(query, user.id)

    // Now fetch emails from auth.users for these profiles
    const serviceSupabase = createServiceRoleClient()
    const { data: authUsers } = await serviceSupabase.auth.admin.listUsers()

    // Map auth users by id
    const authUsersMap = new Map()
    authUsers.users.forEach(authUser => {
      authUsersMap.set(authUser.id, authUser)
    })

    // Add email to each profile
    const profilesWithEmails = profiles.map(profile => ({
      ...profile,
      email: authUsersMap.get(profile.id)?.email || null
    }))

    // Now filter profiles that match the query in name OR email
    const filtered = profilesWithEmails.filter(profile => {
      const nameMatch = profile.full_name?.toLowerCase().includes(query.toLowerCase())
      const emailMatch = profile.email?.toLowerCase().includes(query.toLowerCase())
      return nameMatch || emailMatch
    })

    return NextResponse.json(filtered)
  } catch (error) {
    console.error("Error searching profiles:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

