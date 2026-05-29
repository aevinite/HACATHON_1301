
import { NextResponse } from "next/server"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"
import { createClient } from "@/lib/supabase-server"

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

    return NextResponse.json(profiles)
  } catch (error) {
    console.error("Error searching profiles:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
