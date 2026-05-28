
import { notFound } from "next/navigation"
import { HackathonsRepository } from "@/data/repositories/hackathons-repository"
import { TimelineEventsRepository } from "@/data/repositories/timeline-events-repository"
import { TeamsRepository } from "@/data/repositories/teams-repository"
import { ProjectsRepository } from "@/data/repositories/projects-repository"
import { RubricCriteriaRepository } from "@/data/repositories/rubric-criteria-repository"
import { JudgesRepository } from "@/data/repositories/judges-repository"
import { getCurrentProfile } from "@/features/auth/server/session"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Timeline } from "@/components/timeline"
import { EmptyState } from "@/components/empty-state"
import { JoinHackathonButton } from "@/features/hackathons/components/join-button"
import { ProblemStatementButton } from "@/features/hackathons/components/problem-statement-button"
import Link from "next/link"
import { Calendar, Clock, ArrowLeft, FileText, Lightbulb, Award, Users } from "lucide-react"
import { createClient } from "@/lib/supabase-server"
import { 
  getHackathonLifecycleStatus, 
  getHackathonStatusLabel, 
  getHackathonStatusBadgeClass 
} from "@/lib/format-hackathon-status"

export default async function HackathonDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const repository = new HackathonsRepository()
  const timelineRepository = new TimelineEventsRepository()
  const teamsRepository = new TeamsRepository()
  const projectsRepository = new ProjectsRepository()
  const rubricCriteriaRepository = new RubricCriteriaRepository()
  const judgesRepository = new JudgesRepository()
  const supabase = await createClient()
  const today = new Date()
  const { id } = await params
  const resolvedSearchParams = await searchParams

  const [hackathon, timelineEvents, rubricCriteria, profile, hackathonJudges] = await Promise.all([
    repository.findByIdWithDetails(id),
    timelineRepository.findByHackathonId(id),
    rubricCriteriaRepository.findByHackathonId(id),
    getCurrentProfile(),
    judgesRepository.findByHackathonId(id),
  ])

  if (!hackathon) {
    notFound()
  }

  const lifecycle = getHackathonLifecycleStatus(hackathon!)
  const lifecycleLabel = getHackathonStatusLabel(lifecycle)
  const lifecycleBadgeClass = getHackathonStatusBadgeClass(lifecycle)

  function getCurrentPhase() {
    return lifecycleLabel
  }

  function getStatusMessage() {
    const h = hackathon!
    if (!h.start_date) return "Event not scheduled yet"

    switch (lifecycle) {
      case "registration_open":
        return "Registration is open"
      case "not_started":
        const startDate = new Date(h.start_date)
        const diffTime = startDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        if (diffDays === 1) return "Starts tomorrow"
        if (diffDays > 1) return `Starts in ${diffDays} days`
        return "Hackathon has not started yet"
      case "running":
        return "Hackathon is running"
      case "judging":
        return "Judging is in progress"
      case "completed":
        return "Hackathon is completed"
      default:
        return lifecycleLabel
    }
  }

  const getSafeReturnTo = (returnTo: string | string[] | undefined): string => {
    if (typeof returnTo !== "string") return ""
    if (returnTo.startsWith("/dashboard")) return returnTo
    return ""
  }

  const getSafeReturnLabel = (returnLabel: string | string[] | undefined): string => {
    if (typeof returnLabel !== "string") return "Back to Hackathons"
    return returnLabel
  }

  const returnTo = getSafeReturnTo(resolvedSearchParams.returnTo)
  const returnLabel = getSafeReturnLabel(resolvedSearchParams.returnLabel)
  const backHref = returnTo || "/dashboard/hackathons"

  const user = profile ? { id: profile.id } : null
  let isParticipating = false
  let userTeam = null
  if (user) {
    userTeam = await teamsRepository.findByHackathonAndUserId(id, user.id)
    isParticipating = !!userTeam
  }
  const userRole = profile?.role || "team"

  const projects = await projectsRepository.findByHackathonId(id)

  const formatDate = (date: string | null) => {
    if (!date) return "—"
    return new Date(date).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatShortDate = (date: string | null) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
  }

  const timelineFromDates = [
    hackathon.registration_start_date && { id: "1", label: "Registration Opens", date: hackathon.registration_start_date, description: "" },
    hackathon.registration_deadline && { id: "2", label: "Registration Closes", date: hackathon.registration_deadline, description: "" },
    hackathon.start_date && { id: "3", label: "Hackathon Starts", date: hackathon.start_date, description: "" },
    hackathon.submission_deadline && { id: "4", label: "Submissions Close", date: hackathon.submission_deadline, description: "" },
    hackathon.judging_deadline && { id: "5", label: "Judging Ends", date: hackathon.judging_deadline, description: "" },
  ].filter(Boolean) as Array<{ id: string; label: string; date: string; description: string }>

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {returnLabel}
          </Link>
        </Button>
      </div>

      {/* HERO/BANNER SECTION */}
      <div className="relative rounded-3xl overflow-hidden mb-8 group">
        {hackathon.banner_image ? (
          <div className="w-full aspect-[16/9] bg-muted flex items-center justify-center">
            <img
              src={hackathon.banner_image}
              alt={hackathon.name}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-full aspect-[16/9] bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="outline" className={lifecycleBadgeClass}>
                  {lifecycleLabel}
                </Badge>
                <Badge variant="outline">{getStatusMessage()}</Badge>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2">
                {hackathon.name}
              </h1>
              {hackathon.theme && (
                <p className="text-muted-foreground text-lg">
                  {hackathon.theme}
                </p>
              )}
            </div>

            {/* ACTION BUTTONS */}
            {user && (
              <div className="flex flex-wrap gap-3">
                {userRole === "team" && (
                  <JoinHackathonButton
                    hackathonId={hackathon.id}
                    isParticipating={isParticipating}
                    hackathon={hackathon}
                    team={userTeam}
                  />
                )}
                {userRole === "admin" && (
                  <div className="flex flex-wrap gap-3">
                    <Button asChild>
                      <Link href={`/dashboard/admin/hackathons/${hackathon.id}/edit?returnTo=/dashboard/hackathons/${hackathon.id}&returnLabel=Back%20to%20Hackathon`}>
                        Edit Hackathon
                      </Link>
                    </Button>
                    <Button variant="secondary" asChild>
                      <Link href={`/dashboard/admin/projects?returnTo=/dashboard/hackathons/${hackathon.id}&returnLabel=Back%20to%20Hackathon`}>
                        Manage Projects
                      </Link>
                    </Button>
                    <Button variant="secondary" asChild>
                      <Link href={`/dashboard/admin/teams?returnTo=/dashboard/hackathons/${hackathon.id}&returnLabel=Back%20to%20Hackathon`}>
                        Manage Teams
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/dashboard/admin/hackathons`}>
                        Manage Hackathons
                      </Link>
                    </Button>
                  </div>
                )}
                {userRole === "judge" && (
                  <Button variant="secondary" asChild>
                    <Link href={`/dashboard`}>
                      Back to Dashboard
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MAIN CONTENT - 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-8">
          {userRole === "admin" && hackathon && (
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h2 className="text-xl font-bold text-white mb-4">Management Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="rounded-xl p-4 bg-gradient-to-br from-blue-600/20 to-blue-500/5 border border-blue-500/20">
                  <p className="text-slate-400 text-sm mb-1">Assigned Judges</p>
                  <p className="text-2xl font-bold text-white">{hackathonJudges.length}</p>
                </div>
                <Link href={`/dashboard/admin/teams?hackathonId=${hackathon.id}&returnTo=/dashboard/hackathons/${hackathon.id}&returnLabel=Back%20to%20Hackathon%20Detail`} className="rounded-xl p-4 bg-gradient-to-br from-blue-600/20 to-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-all">
                  <p className="text-slate-400 text-sm mb-1">Teams</p>
                  <p className="text-2xl font-bold text-white">{hackathon.team_count}</p>
                </Link>
                <Link href={`/dashboard/admin/projects?hackathonId=${hackathon.id}&returnTo=/dashboard/hackathons/${hackathon.id}&returnLabel=Back%20to%20Hackathon%20Detail`} className="rounded-xl p-4 bg-gradient-to-br from-blue-600/20 to-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-all">
                  <p className="text-slate-400 text-sm mb-1">Projects</p>
                  <p className="text-2xl font-bold text-white">{hackathon.project_count}</p>
                </Link>
                <div className="rounded-xl p-4 bg-gradient-to-br from-blue-600/20 to-blue-500/5 border border-blue-500/20">
                  <p className="text-slate-400 text-sm mb-1">Status</p>
                  <p className="text-lg font-bold text-white capitalize">{hackathon.status}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="sm">
                  <Link href={`/dashboard/admin/hackathons/${hackathon.id}/edit?returnTo=/dashboard/hackathons/${hackathon.id}&returnLabel=Back%20to%20Hackathon`}>
                    Edit Hackathon
                  </Link>
                </Button>
                <Button variant="secondary" asChild size="sm">
                  <Link href={`/dashboard/admin/teams?hackathonId=${hackathon.id}&returnTo=/dashboard/hackathons/${hackathon.id}&returnLabel=Back%20to%20Hackathon`}>
                    Manage Teams
                  </Link>
                </Button>
                <Button variant="secondary" asChild size="sm">
                  <Link href={`/dashboard/admin/projects?hackathonId=${hackathon.id}&returnTo=/dashboard/hackathons/${hackathon.id}&returnLabel=Back%20to%20Hackathon`}>
                    Manage Projects
                  </Link>
                </Button>
              </div>
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">About the Challenge</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {hackathon.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Problem Statement</CardTitle>
            </CardHeader>
            <CardContent>
              {hackathon.problem_statement ? (
                <ProblemStatementButton hackathonId={hackathon.id} />
              ) : (
                <p className="text-muted-foreground">
                  Problem statement will be available soon.
                </p>
              )}
            </CardContent>
          </Card>



          {/* Rubric Criteria Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-xl">Judging Criteria / Rubric</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">These are the criteria judges use while scoring projects.</p>
              {rubricCriteria.length === 0 ? (
                <p className="text-muted-foreground">Judging criteria will be announced soon.</p>
              ) : (
                <div className="space-y-4">
                  {rubricCriteria.map((criterion) => (
                    <div key={criterion.id} className="flex items-start justify-between gap-4 pb-4 border-b last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{criterion.name}</p>
                        {criterion.description && (
                          <p className="text-sm text-muted-foreground mt-1">{criterion.description}</p>
                        )}
                      </div>
                      <Badge variant="secondary">{criterion.max_score} pts</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline Section */}
          {timelineFromDates.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Event Timeline</h2>
              <div className="space-y-4">
                {timelineFromDates.map((event, idx) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                        new Date(event.date) <= today ? "bg-blue-500 border-blue-500" : "bg-transparent border-muted-foreground"
                      }`}>
                        {new Date(event.date) <= today && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                      </div>
                      {idx < timelineFromDates.length - 1 && (
                        <div className="w-0.5 h-full bg-muted-foreground/30 my-1" />
                      )}
                    </div>
                    <div className="pb-6">
                      <p className="font-medium">{event.label}</p>
                      <p className="text-sm text-muted-foreground">{formatShortDate(event.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project Submissions Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Project Submissions</h2>
            
            {projects.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No projects submitted yet"
                description="Be the first to submit a project!"
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {projects.map((project) => (
                  <Card key={project.id}>
                    <CardHeader>
                      <CardTitle className="text-xl">{project.name}</CardTitle>
                      {project.tagline && (
                        <p className="text-sm text-muted-foreground mt-1">{project.tagline}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground line-clamp-3 mb-4">
                        {project.description}
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                          {formatDate(project.created_at)}
                        </p>
                        <Button variant="secondary" size="sm" asChild>
                          <Link href={`/dashboard/projects/${project.id}?returnTo=/dashboard/hackathons/${id}&returnLabel=Back%20to%20Hackathon`}>
                            View Project
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR - 1 column on large screens */}
        <div className="lg:col-span-1 space-y-6">
          {/* Hackathon Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hackathon Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Phase</p>
                <p className="text-lg font-medium">{getCurrentPhase()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={lifecycleBadgeClass}>
                    {lifecycleLabel}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hackathon.registration_start_date && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Registration Opens</p>
                  <p className="text-sm">{formatDate(hackathon.registration_start_date)}</p>
                </div>
              )}

              {hackathon.registration_deadline && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Registration Closes</p>
                  <p className="text-sm">{formatDate(hackathon.registration_deadline)}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Hackathon Starts</p>
                <p className="text-sm">{formatDate(hackathon.start_date)}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Submission Deadline</p>
                <p className="text-sm">{formatDate(hackathon.submission_deadline)}</p>
              </div>

              {hackathon.judging_deadline && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Judging Ends</p>
                  <p className="text-sm">{formatDate(hackathon.judging_deadline)}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Team Size</p>
                <p className="text-sm">
                  {hackathon.min_team_size === hackathon.max_team_size
                    ? `${hackathon.min_team_size} Member`
                    : `${hackathon.min_team_size} - ${hackathon.max_team_size} Members`}
                </p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created At</p>
                <p className="text-sm">{formatDate(hackathon.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          {userRole === "admin" && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Assigned Judges</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {hackathonJudges.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No judges assigned yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {hackathonJudges.map((judge) => (
                      <div key={judge.id} className="p-3 border rounded-md bg-muted/30">
                        <p className="font-medium">{judge.name}</p>
                        <p className="text-sm text-muted-foreground">{judge.email}</p>
                      </div>
                    ))}
                  </div>
                )}
                <Button asChild size="sm" className="w-full">
                  <Link href={`/dashboard/admin/hackathons/${hackathon.id}/edit?returnTo=/dashboard/hackathons/${hackathon.id}&returnLabel=Back%20to%20Hackathon`}>
                    Edit Assignments
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Rules & Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rules &amp; Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                  <span>Team members must be registered users</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                  <span>Submit project before deadline</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                  <span>Keep GitHub/live demo links valid</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                  <span>Judges evaluate based on rubric/score</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
