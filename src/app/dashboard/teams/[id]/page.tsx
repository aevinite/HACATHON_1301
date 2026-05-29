
import Link from "next/link"
import { notFound } from "next/navigation"
import { Users, Calendar, ArrowLeft, Shield, FileText, Trophy } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TeamsRepository } from "@/data/repositories/teams-repository"
import { TeamMembersRepository } from "@/data/repositories/team-members-repository"
import { HackathonsRepository } from "@/data/repositories/hackathons-repository"
import { ProjectsRepository } from "@/data/repositories/projects-repository"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"
import { createClient } from "@/lib/supabase-server"
import { isProjectSubmissionAllowed, getSubmissionStatusText } from "@/lib/format-hackathon-status"
import { EditTeamMembers } from "@/features/teams/components/EditTeamMembers"

export default async function TeamDetailPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const teamsRepo = new TeamsRepository()
  const teamMembersRepo = new TeamMembersRepository()
  const hackathonsRepo = new HackathonsRepository()
  const projectsRepo = new ProjectsRepository()
  const profilesRepo = new ProfilesRepository()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { id } = await params
  const resolvedSearchParams = await searchParams

  const team = await teamsRepo.findById(id)
  if (!team) {
    notFound()
  }

  const hackathon = await hackathonsRepo.findById(team.hackathon_id)
  const members = await teamMembersRepo.findByTeamId(id)
  console.log("=== TEAM MEMBERS:", members)
  const project = await projectsRepo.findByTeamId(id)
  const leaderProfile = team.leader_id ? await profilesRepo.findById(team.leader_id) : null
  
  // Check if current user is leader or admin
  const currentUserProfile = user ? await profilesRepo.findByUserId(user.id) : null
  const isLeader = !!user && user.id === team.leader_id
  const isAdmin = !!currentUserProfile && currentUserProfile.role === "admin"
  const canEdit = isLeader || isAdmin

  const getSafeReturnTo = (returnTo: string | string[] | undefined): string => {
    if (typeof returnTo !== "string") return ""
    if (returnTo.startsWith("/dashboard")) return returnTo
    return ""
  }

  const getSafeReturnLabel = (returnLabel: string | string[] | undefined): string => {
    if (typeof returnLabel !== "string") return "Back to Teams"
    return returnLabel
  }

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "U"
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const returnTo = getSafeReturnTo(resolvedSearchParams.returnTo)
  const returnLabel = getSafeReturnLabel(resolvedSearchParams.returnLabel)
  const backHref = returnTo || "/dashboard/teams"

  return (
    <div key={`team-page-${members.length}`} className="p-6 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {returnLabel}
          </Link>
        </Button>
      </div>

      <div className="max-w-4xl mx-auto grid gap-6">
        {/* Debug Box */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs overflow-auto max-h-48 bg-black/30 p-3 rounded">
              <pre>{JSON.stringify({
                leaderProfile,
                members,
                team,
                leader_id: team.leader_id
              }, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
        
        {/* Team Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">{team.name}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(team.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Hackathon */}
        {hackathon && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Hackathon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{hackathon.name}</p>
              <Button variant="secondary" size="sm" className="mt-3" asChild>
                <Link href={`/dashboard/hackathons/${hackathon.id}?returnTo=/dashboard/teams/${id}&returnLabel=Back%20to%20Team`}>
                  View Hackathon
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Members */}
        <Card>
          <CardHeader className="flex flex-row items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members
            </CardTitle>
            <EditTeamMembers 
              team={team} 
              members={members} 
              leaderProfile={leaderProfile} 
              isLeader={canEdit} 
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{getInitials(leaderProfile?.full_name)}</span>
              </div>
              <div>
                <p className="text-blue-300 font-medium text-sm">{leaderProfile?.full_name || "Team Leader"}</p>
                <p className="text-xs text-muted-foreground">Team Leader</p>
              </div>
              <Badge className="ml-auto text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Shield className="mr-1 h-3 w-3" /> Leader
              </Badge>
            </div>
            {members.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground italic">No additional members yet.</p>
                <div className="p-2 border border-yellow-500/30 bg-yellow-500/10 rounded text-xs text-yellow-300">
                  <p>💡 Leader Profile Note: Check your profiles table!</p>
                </div>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

        {/* Project */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project ? (
              <div className="space-y-3">
                <p className="font-medium">{project.name}</p>
                {project.tagline && <p className="text-sm text-muted-foreground">{project.tagline}</p>}
                <Button variant="default" asChild>
                  <Link href={`/dashboard/projects/${project.id}?returnTo=/dashboard/teams/${id}&returnLabel=Back%20to%20Team`}>
                    View Project
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-muted-foreground">No project submitted yet.</p>
                {hackathon && isProjectSubmissionAllowed(hackathon as any) ? (
                  <Link href={`/dashboard/teams/${id}/project/new?hackathon_id=${hackathon.id}`}>
                    <Button>Submit Project</Button>
                  </Link>
                ) : (
                  hackathon && (
                    <p className="text-sm text-yellow-400 font-medium">{getSubmissionStatusText(hackathon as any)}</p>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
