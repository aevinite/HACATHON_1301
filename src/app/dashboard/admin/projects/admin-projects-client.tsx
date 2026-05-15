
"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useActionState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, Trophy, Users, Eye, Search, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { disqualifyProjectAction, restoreProjectAction } from "@/features/projects/server/actions"

type ProjectWithDetails = {
  id: string
  name: string
  tagline: string | null
  created_at: string
  status: string
  average_score: number | null
  total_judged: number | null
  teams: { name: string } | null
  hackathons: { name: string; id: string } | null
}

interface AdminProjectsClientProps {
  initialProjects: ProjectWithDetails[]
  initialHackathonId?: string
  hackathonName?: string
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatStatus(status: string) {
  switch (status) {
    case "draft":
      return "Draft"
    case "submitted":
      return "Submitted"
    case "disqualified":
      return "Disqualified"
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case "draft":
      return "bg-white/5 text-slate-400 border-white/10"
    case "submitted":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20"
    case "disqualified":
      return "bg-red-500/10 text-red-400 border-red-500/20"
    default:
      return "bg-white/5 text-slate-400 border-white/10"
  }
}

function ProjectModerationButton({ projectId, action, label, variant, confirmMessage }: {
  projectId: string
  action: typeof disqualifyProjectAction
  label: string
  variant: "destructive" | "secondary"
  confirmMessage?: string
}) {
  const [state, formAction, isPending] = useActionState(action, {})
  
  return (
    <form action={formAction} onSubmit={confirmMessage ? (e) => { if (!confirm(confirmMessage)) { e.preventDefault() } } : undefined}>
      <input type="hidden" name="project_id" value={projectId} />
      <Button variant={variant} size="sm" type="submit" disabled={isPending} className={variant === "secondary" ? "bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400" : ""}>
        {isPending ? "Processing..." : label}
      </Button>
    </form>
  )
}

export default function AdminProjectsClient({ initialProjects, initialHackathonId, hackathonName }: AdminProjectsClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [scoreFilter, setScoreFilter] = useState("all")
  const [hackathonIdFilter, setHackathonIdFilter] = useState(initialHackathonId)

  const filteredProjects = useMemo(() => {
    return initialProjects.filter(project => {
      const matchesSearch = 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.tagline && project.tagline.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (project.teams && project.teams.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (project.hackathons && project.hackathons.name.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesScore = 
        scoreFilter === "all" ||
        (scoreFilter === "scored" && project.average_score !== null) ||
        (scoreFilter === "not_scored" && project.average_score === null)
      
      const matchesHackathon = !hackathonIdFilter || project.hackathons?.id === hackathonIdFilter
      
      return matchesSearch && matchesScore && matchesHackathon
    })
  }, [initialProjects, searchQuery, scoreFilter, hackathonIdFilter])

  return (
    <div className="space-y-6 min-h-screen grid-bg">
      {hackathonIdFilter && hackathonName && (
        <div className="glass rounded-2xl p-4 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-600/20 to-cyan-500/5 flex items-center justify-center">
              <FileText className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Showing projects for</p>
              <p className="text-lg font-bold text-white">{hackathonName}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" asChild className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 text-slate-200">
            <Link href="/dashboard/admin/projects">
              Clear filter
            </Link>
          </Button>
        </div>
      )}
      <AdminPageHeader
        title="Manage Projects"
        description="View all projects submitted to hackathons on the platform"
      />

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by name, tagline, team, or hackathon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={scoreFilter} onValueChange={setScoreFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="scored">Scored</SelectItem>
            <SelectItem value="not_scored">Not scored</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <FileText className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-white">
            {hackathonIdFilter 
              ? "No projects found for this hackathon" 
              : (initialProjects.length === 0 ? "No projects yet" : "No projects match your filters")}
          </p>
          <p className="text-slate-400 mt-1">
            {hackathonIdFilter 
              ? "This hackathon doesn't have any projects yet!" 
              : (initialProjects.length === 0 
                ? "Projects will appear here once participants start submitting them!" 
                : "Try adjusting your search or filter criteria")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProjects.map((project) => (
            <div key={project.id} className="glass rounded-2xl p-6 border border-white/10 hover:border-blue-500/40 transition-all hover:shadow-xl hover:shadow-blue-500/10">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-white">{project.name}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="default" className={getStatusVariant(project.status)}>
                        {formatStatus(project.status)}
                      </Badge>
                      {project.average_score !== null ? (
                        <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          Score: {project.average_score.toFixed(1)}
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-white/5 text-slate-400 border-white/10">
                          Not scored yet
                        </Badge>
                      )}
                    </div>
                  </div>
                  {project.tagline && (
                    <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                      {project.tagline}
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {project.teams && (
                      <div className="rounded-xl p-3 bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-4 w-4 text-slate-500" />
                          <p className="text-xs text-slate-500">Team</p>
                        </div>
                        <p className="text-sm font-medium text-slate-300 line-clamp-1">
                          {project.teams.name}
                        </p>
                      </div>
                    )}
                    {project.hackathons && (
                      <div className="rounded-xl p-3 bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className="h-4 w-4 text-slate-500" />
                          <p className="text-xs text-slate-500">Hackathon</p>
                        </div>
                        <p className="text-sm font-medium text-slate-300 line-clamp-1">
                          {project.hackathons.name}
                        </p>
                      </div>
                    )}
                    <div className="rounded-xl p-3 bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <p className="text-xs text-slate-500">Created</p>
                      </div>
                      <p className="text-sm font-medium text-slate-300">
                        {formatDate(project.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-white/10 flex flex-wrap gap-2 justify-end">
                {project.hackathons && (
                  <Button variant="secondary" size="sm" asChild className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 text-slate-200">
                    <Link href={`/dashboard/hackathons/${project.hackathons.id}?returnTo=/dashboard/admin/projects&returnLabel=Back%20to%20Manage%20Projects`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Hackathon
                    </Link>
                  </Button>
                )}
                <Button variant="default" size="sm" asChild className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20">
                  <Link href={`/dashboard/projects/${project.id}?returnTo=/dashboard/admin/projects&returnLabel=Back%20to%20Manage%20Projects`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Project
                  </Link>
                </Button>
                {project.status === "submitted" && (
                  <ProjectModerationButton
                    projectId={project.id}
                    action={disqualifyProjectAction}
                    label="Disqualify"
                    variant="destructive"
                    confirmMessage="Are you sure you want to disqualify this project?"
                  />
                )}
                {project.status === "disqualified" && (
                  <ProjectModerationButton
                    projectId={project.id}
                    action={restoreProjectAction}
                    label="Restore"
                    variant="secondary"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
