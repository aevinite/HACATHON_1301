
import Link from "next/link"
import { Calendar, Trophy } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Database } from "@/types/supabase"

type Hackathon = Database["public"]["Tables"]["hackathons"]["Row"]

interface HackathonCardProps {
  hackathon: Hackathon
  showCurrentIndicator?: boolean
  returnTo?: string
  returnLabel?: string
}

export function HackathonCard({ hackathon, showCurrentIndicator = true, returnTo, returnLabel }: HackathonCardProps) {
  const statusColors = {
    draft: "bg-slate-500",
    registration: "bg-blue-500",
    submission: "bg-yellow-500",
    judging: "bg-purple-500",
    completed: "bg-green-500",
  }

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
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20 group ${isCurrentlyActive ? 'border-2 border-blue-500/50' : ''}`}>
      {isCurrentlyActive && showCurrentIndicator && (
        <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 text-center uppercase tracking-wider">
          Current Event
        </div>
      )}
      {hackathon.banner_image && (
        <div className="h-48 w-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: `url(${hackathon.banner_image})` }} />
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <CardTitle className="line-clamp-1 text-lg leading-tight">{hackathon.name}</CardTitle>
            <CardDescription className="line-clamp-2 leading-relaxed">
              {hackathon.description}
            </CardDescription>
          </div>
          <Badge className={statusColors[hackathon.status as keyof typeof statusColors]} variant="secondary">
            {hackathon.status.charAt(0).toUpperCase() + hackathon.status.slice(1)}
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
      <CardFooter className="pt-0">
        <Button asChild variant="secondary" size="sm" className="w-full">
          <Link href={`/dashboard/hackathons/${hackathon.id}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}&returnLabel=${encodeURIComponent(returnLabel || "Back to Hackathons")}` : ""}`}>
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
