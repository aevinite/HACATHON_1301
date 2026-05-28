
"use client"

import { useActionState, useEffect } from "react"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { joinHackathonAction } from "@/features/hackathons/server/join-action"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Database } from "@/types/supabase"
import { isHackathonRegistrationOpen } from "@/lib/format-hackathon-status"

type Hackathon = Database["public"]["Tables"]["hackathons"]["Row"]
type Team = Database["public"]["Tables"]["teams"]["Row"]

interface JoinHackathonButtonProps {
  hackathonId: string
  isParticipating: boolean
  hackathon: Hackathon
  team?: Team | null
}

export function JoinHackathonButton({ hackathonId, isParticipating, hackathon, team }: JoinHackathonButtonProps) {
  const [state, formAction, isPending] = useActionState(joinHackathonAction, { error: undefined, teamId: undefined, hackathonId: undefined, isNewTeam: undefined })
  const router = useRouter()
  const registrationOpen = isHackathonRegistrationOpen(hackathon)
  const now = new Date()
  const hackathonStarted = hackathon.start_date ? now >= new Date(hackathon.start_date) : false

  useEffect(() => {
    if (state.teamId && state.hackathonId) {
      const queryParams = new URLSearchParams()
      queryParams.set("setup", "1")
      queryParams.set("returnTo", `/dashboard/hackathons/${state.hackathonId}`)
      queryParams.set("returnLabel", "Back to Hackathon")
      if (state.isNewTeam) {
        queryParams.set("new", "1")
      }
      router.push(`/dashboard/teams/${state.teamId}?${queryParams.toString()}`)
    }
  }, [state.teamId, state.hackathonId, state.isNewTeam, router])

  const getButtonText = () => {
    if (!isParticipating && !registrationOpen) {
      if (hackathonStarted) {
        return "Hackathon Running"
      }
      return "Registration Closed"
    }
    return "Join Hackathon"
  }

  if (isParticipating) {
    return (
      <div className="flex-1 w-full">
        {team ? (
          <Button asChild variant="secondary" size="default" className="w-full overflow-hidden text-base py-2">
            <Link href={`/dashboard/teams/${team.id}?returnTo=/dashboard/hackathons/${hackathonId}&returnLabel=Back%20to%20Hackathon`} className="w-full">
              <Users className="mr-2 h-4 w-4" />
              Participating
            </Link>
          </Button>
        ) : (
          <Button disabled variant="secondary" size="default" className="w-full overflow-hidden text-base py-2">
            <Users className="mr-2 h-4 w-4" />
            Participating
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 w-full">
      <form action={formAction} className="w-full">
        <input type="hidden" name="hackathon_id" value={hackathonId} />
        <Button 
          disabled={!registrationOpen || isPending} 
          variant="default"
          size="default"
          className="w-full overflow-hidden text-base py-2"
        >
          {isPending ? "Joining..." : getButtonText()}
        </Button>
      </form>
    </div>
  )
}
