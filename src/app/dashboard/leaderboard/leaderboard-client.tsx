
"use client"

import { useState, useMemo, useActionState, useRef } from "react"
import Link from "next/link"
import { Trophy, FileText, Calendar, Users, ArrowRight, Eye } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Database } from "@/types/supabase"
import { updateResultVisibilityAction } from "@/features/hackathons/server/actions"

type ProjectWithDetails = {
  id: string
  name: string
  tagline: string | null
  average_score: number | null
  total_judged: number
  teams: { name: string } | null
  hackathons: { name: string; id: string } | null
}

type Hackathon = Database["public"]["Tables"]["hackathons"]["Row"]

interface LeaderboardClientProps {
  initialProjects: ProjectWithDetails[]
  initialHackathons: Hackathon[]
  allHackathons: Hackathon[]
  isAdmin: boolean
  isJudge: boolean
}

function getStatusLabel(hackathon: Hackathon): string {
  if (hackathon.results_visible_to_participants) {
    return "Published"
  } else if (hackathon.results_visible_to_judges) {
    return "Published to Judges Only"
  } else {
    return "Not Published"
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "Not Published":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20"
    case "Published to Judges Only":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    case "Published":
      return "bg-green-500/10 text-green-400 border-green-500/20"
    default:
      return "bg-white/5 text-slate-400 border-white/10"
  }
}

function getVisibilityValue(hackathon: Hackathon): "private" | "judges" | "published" {
  if (hackathon.results_visible_to_participants) {
    return "published"
  } else if (hackathon.results_visible_to_judges) {
    return "judges"
  } else {
    return "private"
  }
}

function ResultVisibilityRow({ hackathon }: { hackathon: Hackathon }) {
  const [selectedVisibility, setSelectedVisibility] = useState<string>(getVisibilityValue(hackathon))
  const [state, formAction, isPending] = useActionState(updateResultVisibilityAction, { error: undefined, success: undefined })
  const formRef = useRef<HTMLFormElement>(null)

  function handleSave() {
    if (formRef.current) {
      formRef.current.requestSubmit()
    }
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
      <div className="flex items-center gap-4">
        <h3 className="font-medium text-white">{hackathon.name}</h3>
        <Badge variant="default" className={getStatusBadgeClass(getStatusLabel(hackathon))}>
          {getStatusLabel(hackathon)}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <form ref={formRef} action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="hackathonId" value={hackathon.id} />
          <Select 
            value={selectedVisibility} 
            onValueChange={setSelectedVisibility}
            name="visibility"
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Not Published</SelectItem>
              <SelectItem value="judges">Published to Judges Only</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleSave} 
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </form>
        {state.error && (
          <p className="text-xs text-red-400">{state.error}</p>
        )}
      </div>
    </div>
  )
}

function HackathonLeaderboardSection({ 
  hackathon, 
  projects,
  isAdmin
}: { 
  hackathon: Hackathon, 
  projects: ProjectWithDetails[],
  isAdmin: boolean
}) {
  const scoredProjects = useMemo(() => {
    return projects.filter(p => p.average_score !== null)
  }, [projects])

  const sortedProjects = useMemo(() => {
    return [...scoredProjects].sort((a, b) => {
      const scoreA = a.average_score ?? 0
      const scoreB = b.average_score ?? 0
      if (scoreB !== scoreA) {
        return scoreB - scoreA
      }
      return a.name.localeCompare(b.name)
    })
  }, [scoredProjects])

  const top3Projects = sortedProjects.slice(0, 3)
  const restProjects = sortedProjects.slice(3)

  const canShowResults = isAdmin || hackathon.results_visible_to_judges || hackathon.results_visible_to_participants

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{hackathon.name}</h2>
        </div>
      </div>

      {!canShowResults ? (
        <EmptyState
          icon={Eye}
          title="Results are not announced yet"
          description="The leaderboard will appear here once the admin publishes the results."
        />
      ) : sortedProjects.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No scored projects yet"
          description="Scores will appear here after judges review projects."
        />
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3Projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((idx) => {
                const project = top3Projects[idx]
                if (!project) return null
                const medalColors = ["text-yellow-500", "text-slate-300", "text-amber-600"]
                const heights = ["h-36", "h-28", "h-24"]
                const ranks = ["#1", "#2", "#3"]

                return (
                  <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="block">
                    <Card className="h-full flex flex-col justify-end items-center p-4">
                      <div className={`flex flex-col items-center justify-end ${heights[idx]}`}>
                        <Trophy className={`h-8 w-8 ${medalColors[idx]}`} />
                        <p className="text-xs font-medium text-muted-foreground mt-1">{ranks[idx]}</p>
                        <p className="text-sm font-bold mt-2">{project.name}</p>
                        {project.average_score !== null && (
                          <p className="text-lg font-bold">{project.average_score.toFixed(1)}</p>
                        )}
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Rest of list */}
          {restProjects.length > 0 && (
            <div className="space-y-4">
              {restProjects.map((project, index) => (
                <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="block">
                  <Card className="hover:border-blue-500 transition-colors cursor-pointer">
                    <CardHeader className="pb-2 flex flex-row items-start gap-4">
                      <div className="flex-shrink-0 flex items-center justify-center w-10 h-10">
                        <span className="text-lg font-bold text-muted-foreground">#{index + 4}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold line-clamp-1">{project.name}</CardTitle>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {project.teams && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{project.teams.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {project.average_score !== null ? (
                          <>
                            <span className="text-xl font-bold text-foreground">
                              {project.average_score.toFixed(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {project.total_judged} judge{project.total_judged !== 1 ? 's' : ''}
                            </span>
                          </>
                        ) : (
                          <Badge variant="secondary">Not scored yet</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardFooter className="pt-2 border-t">
                      <Button variant="secondary" size="sm" className="w-full">
                        View Project
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function LeaderboardClient({ 
  initialProjects, 
  initialHackathons, 
  allHackathons, 
  isAdmin,
  isJudge
}: LeaderboardClientProps) {
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>("all")

  const hackathonsToDisplay = isAdmin ? allHackathons : initialHackathons

  const filteredHackathons = useMemo(() => {
    if (selectedHackathonId === "all") {
      return hackathonsToDisplay
    }
    return hackathonsToDisplay.filter(h => h.id === selectedHackathonId)
  }, [hackathonsToDisplay, selectedHackathonId])

  const getProjectsForHackathon = (hackathonId: string) => {
    return initialProjects.filter(p => p.hackathons?.id === hackathonId)
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Results</h1>
        <p className="text-muted-foreground mt-2">
          Project rankings based on judge scores
        </p>
      </div>

      {isAdmin && (
        <div className="glass rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">Result Visibility</h2>
          <div className="grid gap-4">
            {allHackathons.map((hackathon) => (
              <ResultVisibilityRow key={hackathon.id} hackathon={hackathon} />
            ))}
          </div>
        </div>
      )}

      {!isAdmin && !isJudge && initialHackathons.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Results are not announced yet"
          description="The leaderboard will appear here once the admin publishes the results."
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedHackathonId} onValueChange={setSelectedHackathonId}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Select hackathon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hackathons</SelectItem>
                {hackathonsToDisplay.map((hackathon) => (
                  <SelectItem key={hackathon.id} value={hackathon.id}>{hackathon.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-12">
            {filteredHackathons.map((hackathon) => (
              <div key={hackathon.id} className="border-t border-white/10 pt-8">
                <HackathonLeaderboardSection
                  hackathon={hackathon}
                  projects={getProjectsForHackathon(hackathon.id)}
                  isAdmin={isAdmin}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
