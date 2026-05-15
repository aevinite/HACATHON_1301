
"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Trophy, FileText, Calendar, Users, ArrowRight } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Database } from "@/types/supabase"

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
}

export default function LeaderboardClient({ initialProjects, initialHackathons }: LeaderboardClientProps) {
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>("all")

  const filteredProjects = useMemo(() => {
    if (selectedHackathonId === "all") {
      return initialProjects
    }
    return initialProjects.filter(p => p.hackathons?.id === selectedHackathonId)
  }, [initialProjects, selectedHackathonId])

  const scoredProjects = useMemo(() => {
    return filteredProjects.filter(p => p.average_score !== null)
  }, [filteredProjects])

  const sortedProjects = useMemo(() => {
    return [...scoredProjects].sort((a, b) => {
      const scoreA = a.average_score ?? 0
      const scoreB = b.average_score ?? 0
      return scoreB - scoreA
    })
  }, [scoredProjects])

  const top3Projects = sortedProjects.slice(0, 3)
  const restProjects = sortedProjects.slice(3)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
        <p className="text-muted-foreground mt-2">
          Project rankings based on judge scores
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedHackathonId} onValueChange={setSelectedHackathonId}>
          <SelectTrigger className="w-full sm:w-[300px]">
            <SelectValue placeholder="Select hackathon" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Hackathons</SelectItem>
            {initialHackathons.map((hackathon) => (
              <SelectItem key={hackathon.id} value={hackathon.id}>{hackathon.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {sortedProjects.length === 0 ? (
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
              {[1, 0, 2].map((idx) => {
                const project = top3Projects[idx]
                if (!project) return null
                const medalColors = ["text-slate-300", "text-yellow-500", "text-amber-600"]
                const heights = ["h-28", "h-36", "h-24"]

                return (
                  <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="block">
                    <Card className="h-full flex flex-col justify-end items-center p-4">
                      <div className={`flex flex-col items-center justify-end ${heights[idx]}`}>
                        <Trophy className={`h-8 w-8 ${medalColors[idx]}`} />
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
                        {project.hackathons && (
                          <div className="flex items-center gap-1">
                            <Trophy className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{project.hackathons.name}</span>
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
        </>
      )}
    </div>
  )
}

