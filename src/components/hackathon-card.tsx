
import Link from "next/link"
import { Calendar, Trophy } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Database } from "@/types/supabase"
import { getHackathonLifecycleStatus, getHackathonStatusLabel, getHackathonStatusBadgeClass } from "@/lib/format-hackathon-status"
import { JoinHackathonButton } from "@/features/hackathons/components/join-button"

type Hackathon = Database["public"]["Tables"]["hackathons"]["Row"]
type Team = Database["public"]["Tables"]["teams"]["Row"]

interface HackathonCardProps {
  hackathon: Hackathon
  showCurrentIndicator?: boolean
  returnTo?: string
  returnLabel?: string
  isParticipating?: boolean
  team?: Team | null
}

export function HackathonCard({ hackathon, showCurrentIndicator = true, returnTo, returnLabel, isParticipating = false, team }: HackathonCardProps) {
  const lifecycleStatus = getHackathonLifecycleStatus(hackathon)

  const formatDate = (date: string | null) => {
    if (!date) return "TBD"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const isCurrentlyActive = (() => {
    const today = new Date()
    const startDate = hackathon.start_date ? new Date(hackathon.start_date) : null
    const endDate = hackathon.submission_deadline ? new Date(hackathon.submission_deadline) : null
    
    if (!startDate) return false
    if (today < startDate) return false
    if (endDate && today > endDate) return false
    
    return true
  })()

  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20 group ${isCurrentlyActive ? 'border-2 border-blue-500/50' : ''} flex flex-col h-full`}>
      <div className="h-6">
        {isCurrentlyActive && showCurrentIndicator && (
          <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 text-center uppercase tracking-wider h-full flex items-center justify-center">
            Current Event
          </div>
        )}
      </div>
      <div className="w-full aspect-[16/9] bg-muted flex items-center justify-center group-hover:scale-105 transition-transform duration-500 overflow-hidden rounded-t-lg">
        {hackathon.banner_image ? (
          <img
            src={hackathon.banner_image}
            alt={hackathon.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Trophy className="h-12 w-12 text-slate-600/50" />
          </div>
        )}
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <CardTitle className="line-clamp-1 text-lg leading-tight">{hackathon.name}</CardTitle>
            <CardDescription className="line-clamp-2 leading-relaxed">
              {hackathon.description}
            </CardDescription>
          </div>
          <Badge className={getHackathonStatusBadgeClass(lifecycleStatus)} variant="secondary">
            {getHackathonStatusLabel(lifecycleStatus)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(hackathon.start_date)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4" />
            <span>
              {hackathon.min_team_size}-{hackathon.max_team_size} members
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex flex-col sm:flex-row gap-2 mt-auto w-full">
        <Button asChild variant="secondary" size="sm" className="flex-1 w-full">
          <Link href={`/dashboard/hackathons/${hackathon.id}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}&returnLabel=${encodeURIComponent(returnLabel || "Back to Hackathons")}` : ""}`} className="w-full text-center">
            View Details
          </Link>
        </Button>
        <div className="flex-1 w-full">
          <JoinHackathonButton
            hackathonId={hackathon.id}
            isParticipating={isParticipating}
            hackathon={hackathon}
            team={team}
          />
        </div>
      </CardFooter>
    </Card>
  )
}
