import { NextResponse, type NextRequest } from "next/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"

export async function GET(request: NextRequest) {
  console.log("========== AUTH CALLBACK START ==========")

  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next")

  if (code) {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Auth callback: Exchange code error", error)
        console.log("========== AUTH CALLBACK END (EXCHANGE ERROR) ==========")
        return NextResponse.redirect(new URL("/login?error=oauth_failed", requestUrl.origin))
      }

      const user = data.user
      console.log("Auth callback: Got user", user?.id)

      if (user) {
        const profilesRepo = new ProfilesRepository()
        const existingProfile = await profilesRepo.findByUserId(user.id)

        if (!existingProfile) {
          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            null

          console.log("Auth callback: Creating profile for user", user.id)

          await supabase.from("profiles").insert({
            id: user.id,
            full_name: fullName,
            email: user.email,
            avatar_url: user.user_metadata?.avatar_url || null,
            role: "team",
            is_active: true,
          })
        }
      }

      console.log("Auth callback: Redirecting to dashboard")
      console.log("========== AUTH CALLBACK END (SUCCESS) ==========")
      revalidatePath("/", "layout")
      return NextResponse.redirect(new URL(next || "/dashboard", requestUrl.origin))
    } catch (error) {
      console.error("Auth callback: Unexpected error", error)
      console.log("========== AUTH CALLBACK END (ERROR) ==========")
      return NextResponse.redirect(new URL("/login?error=oauth_failed", requestUrl.origin))
    }
  } else {
    console.log("Auth callback: No code found")
    console.log("========== AUTH CALLBACK END (NO CODE) ==========")
    return NextResponse.redirect(new URL("/login?error=oauth_failed", requestUrl.origin))
  }
}
