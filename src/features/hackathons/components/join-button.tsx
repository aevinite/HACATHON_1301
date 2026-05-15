
"use client"

import { useActionState } from "react"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { joinHackathonAction } from "@/features/hackathons/server/join-action"

interface JoinHackathonButtonProps {
  hackathonId: string
  isParticipating: boolean
}

export function JoinHackathonButton({ hackathonId, isParticipating }: JoinHackathonButtonProps) {
  const [state, formAction, isPending] = useActionState(joinHackathonAction, {})

  return (
    <form action={formAction} className="flex-shrink-0">
      <input type="hidden" name="hackathon_id" value={hackathonId} />
      {isParticipating ? (
        <Button disabled variant="secondary">
          <Users className="mr-2 h-4 w-4" />
          You're Participating
        </Button>
      ) : (
        <Button disabled={isPending}>
          {isPending ? "Joining..." : "Join Hackathon"}
        </Button>
      )}
    </form>
  )
}
