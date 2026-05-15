
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

type Cookie = {
  name: string
  value: string
  options?: CookieOptions
}

export async function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development"
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If required env vars are missing, skip auth and let the app handle it
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isDev) {
      console.error("MIDDLEWARE: Missing SUPABASE env vars!")
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: Cookie[]) {
            cookiesToSet.forEach(cookie => {
              request.cookies.set(cookie.name, cookie.value)
            })
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error?.code === "refresh_token_not_found") {
      const response = NextResponse.next({ request })
      response.cookies.delete("sb-access-token")
      response.cookies.delete("sb-refresh-token")
      response.cookies.delete("sb-auth-token")
      
      const path = request.nextUrl.pathname
      if (path.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/login", request.url))
      }
      return response
    }

    const path = request.nextUrl.pathname

    if (user && (path === "/login" || path === "/signup" || path === "/")) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    if (!user && path.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    return supabaseResponse
  } catch {
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

