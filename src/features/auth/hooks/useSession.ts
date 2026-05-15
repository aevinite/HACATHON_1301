"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase"
import { QUERY_KEYS } from "@/lib/react-query"

export function useSession() {
  const supabase = createClient()
  
  return useQuery({
    queryKey: QUERY_KEYS.auth.session,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    },
    staleTime: 60 * 1000, // 1 minute
  })
}
