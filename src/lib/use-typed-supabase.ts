"use client"

import { useMemo } from "react"
import { createClient } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

export function useTypedSupabase() {
  return useMemo(() => createClient(), [])
}
