import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

type Cookie = {
  name: string
  value: string
  options?: CookieOptions
}

export async function middleware(request: NextRequest) {
  console.log("========== MIDDLEWARE START ==========")
  console.log("MIDDLEWARE: Request path:", request.nextUrl.pathname)
  console.log("MIDDLEWARE: All cookies:", request.cookies.getAll().map(c => ({ name: c.name, value: c.value ? c.value.slice(0, 20) + "..." : "empty" })))
  
  let supabaseResponse = NextResponse.next({
    request,
  })

  console.log("MIDDLEWARE: Creating Supabase client")
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll()
          console.log("MIDDLEWARE: getAll() called, cookies:", cookies.map(c => c.name))
          return cookies
        },
        setAll(cookiesToSet: Cookie[]) {
          console.log("MIDDLEWARE: setAll() called with", cookiesToSet.length, "cookies")
          cookiesToSet.forEach(cookie => {
            console.log("MIDDLEWARE: Setting cookie:", cookie.name, cookie.value ? cookie.value.slice(0, 20) + "..." : "empty")
            request.cookies.set(cookie.name, cookie.value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            console.log("MIDDLEWARE: Setting response cookie:", name)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  console.log("MIDDLEWARE: Calling supabase.auth.getUser()")
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    
    console.log("MIDDLEWARE: getUser() complete")
    console.log("MIDDLEWARE: - User:", user ? user.id : null)
    console.log("MIDDLEWARE: - Error:", error ? error.message : "none")
    console.log("MIDDLEWARE: - Error code:", error ? error.code : "none")

    // Handle invalid refresh token by clearing all auth cookies
    if (error?.code === "refresh_token_not_found") {
      console.log("MIDDLEWARE: Invalid refresh token detected, clearing auth cookies")
      const response = NextResponse.next({ request })
      // Clear all Supabase auth cookies
      response.cookies.delete("sb-access-token")
      response.cookies.delete("sb-refresh-token")
      response.cookies.delete("sb-auth-token")
      console.log("MIDDLEWARE: Auth cookies cleared")
      
      const path = request.nextUrl.pathname
      if (path.startsWith("/dashboard")) {
        console.log("MIDDLEWARE: Redirecting to login after clearing cookies")
        console.log("========== MIDDLEWARE END (CLEAR COOKIES + REDIRECT) ==========")
        return NextResponse.redirect(new URL("/login", request.url))
      }
      console.log("========== MIDDLEWARE END (CLEAR COOKIES) ==========")
      return response
    }
    
    const path = request.nextUrl.pathname

    if (user && (path === "/login" || path === "/signup" || path === "/")) {
      console.log("MIDDLEWARE: Redirecting authenticated user to /dashboard")
      console.log("========== MIDDLEWARE END (REDIRECT TO DASHBOARD) ==========")
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    if (!user && path.startsWith("/dashboard")) {
      console.log("MIDDLEWARE: Redirecting unauthenticated user to /login")
      console.log("========== MIDDLEWARE END (REDIRECT TO LOGIN) ==========")
      return NextResponse.redirect(new URL("/login", request.url))
    }

    console.log("MIDDLEWARE: No redirect, returning response")
    console.log("========== MIDDLEWARE END ==========")
    return supabaseResponse
  } catch (err) {
    console.error("MIDDLEWARE: Caught exception:", err)
    console.log("========== MIDDLEWARE END (EXCEPTION) ==========")
    return supabaseResponse
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
