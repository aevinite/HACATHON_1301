
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink, Users, Trophy, Calendar, GitBranch, Globe, FileText, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProjectsRepository } from "@/data/repositories/projects-repository"
import { TeamsRepository } from "@/data/repositories/teams-repository"
import { HackathonsRepository } from "@/data/repositories/hackathons-repository"
import { TeamMembersRepository } from "@/data/repositories/team-members-repository"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"

export default async function ProjectDetailPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const projectsRepo = new ProjectsRepository()
  const teamsRepo = new TeamsRepository()
  const hackathonsRepo = new HackathonsRepository()
  const teamMembersRepo = new TeamMembersRepository()
  const profilesRepo = new ProfilesRepository()
  const { id } = await params
  const resolvedSearchParams = await searchParams

  const project = await projectsRepo.findById(id)
  if (!project) {
    notFound()
  }

  const team = await teamsRepo.findById(project.team_id)
  const hackathon = await hackathonsRepo.findById(project.hackathon_id)
  
  // Fetch team members and leader profile
  const members = team ? await teamMembersRepo.findByTeamId(team.id) : []
  const leaderProfile = team?.leader_id ? await profilesRepo.findById(team.leader_id) : null
  
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "U"
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "Not set"

    return new Date(date).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getSafeReturnTo = (returnTo: string | string[] | undefined): string => {
    if (typeof returnTo !== "string") return ""
    if (returnTo.startsWith("/dashboard")) return returnTo
    return ""
  }

  const getSafeReturnLabel = (returnLabel: string | string[] | undefined): string => {
    if (typeof returnLabel !== "string") return "Back"
    return returnLabel
  }

  const returnTo = getSafeReturnTo(resolvedSearchParams.returnTo)
  const returnLabel = getSafeReturnLabel(resolvedSearchParams.returnLabel)
  const backHref = returnTo || (hackathon ? `/dashboard/hackathons/${hackathon.id}` : "/dashboard/projects")
  const backLabel = returnTo ? returnLabel : (hackathon ? "View Hackathon" : (team ? "Back to Team" : "Back to Teams"))

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      </div>

      <div className="max-w-4xl mx-auto grid gap-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary">
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </Badge>
                </div>
                <CardTitle className="text-3xl">{project.name}</CardTitle>
                {project.tagline && (
                  <p className="text-muted-foreground mt-2">{project.tagline}</p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Project Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {project.description}
            </p>
          </CardContent>
        </Card>

        {/* Team & Hackathon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team &amp; Hackathon
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {team && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Team</p>
                <p className="font-medium">{team.name}</p>
              </div>
            )}
            {hackathon && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Hackathon</p>
                <p className="font-medium">{hackathon.name}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="font-medium">{formatDate(project.created_at)}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Team Members */}
        {team && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Leader */}
              {leaderProfile && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{getInitials(leaderProfile.full_name)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-blue-300 font-medium text-sm">{leaderProfile.full_name || "Leader"}</p>
                    <p className="text-xs text-muted-foreground">Team Leader</p>
                  </div>
                  <Badge className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Shield className="mr-1 h-3 w-3" /> Leader
                  </Badge>
                </div>
              )}
              
              {/* Other Members */}
              {members.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{getInitials(member.profiles?.full_name)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.profiles?.full_name || "Member"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No additional team members yet.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.github_url || project.live_url ? (
              <div className="flex flex-wrap gap-3">
                {project.github_url && (
                  <Button variant="secondary" asChild>
                    <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                      <GitBranch className="mr-2 h-4 w-4" />
                      GitHub Repository
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                )}
                {project.live_url && (
                  <Button variant="secondary" asChild>
                    <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="mr-2 h-4 w-4" />
                      Live Demo
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No links submitted yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Score Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Score Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.average_score !== null ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">{project.average_score.toFixed(1)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Judges</p>
                  <p className="text-2xl font-bold">{project.total_judged}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    Reviewed
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="outline">
                  Pending Review
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {team && (
            <Button variant="secondary" asChild>
              <Link href={`/dashboard/teams/${team.id}`}>
                Back to Team
              </Link>
            </Button>
          )}
          {hackathon && (
            <Button variant="secondary" asChild>
              <Link href={`/dashboard/hackathons/${hackathon.id}`}>
                View Hackathon
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
