"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase"
import { QUERY_KEYS } from "@/lib/react-query"
import { useSession } from "./useSession"

export function useProfile() {
  const { data: session } = useSession()
  const supabase = createClient()
  
  return useQuery({
    queryKey: QUERY_KEYS.auth.profile,
    queryFn: async () => {
      if (!session?.user?.id) return null
      
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()
      
      return data
    },
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
