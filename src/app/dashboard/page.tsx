
import Link from "next/link"
import { LayoutDashboard, Trophy, Users, FileText, Search, Plus, Award, TrendingUp, Settings, Calendar, ArrowRight, UserRound, Gavel, Eye, Edit } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { getCurrentProfile, getCurrentUser } from "@/features/auth/server/session"
import { ProjectsRepository } from "@/data/repositories/projects-repository"
import { HackathonsRepository } from "@/data/repositories/hackathons-repository"
import { TeamsRepository } from "@/data/repositories/teams-repository"
import { ScoresRepository } from "@/data/repositories/scores-repository"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"
import { JudgesRepository } from "@/data/repositories/judges-repository"
import { formatDate } from "@/lib/format-date"
import { getHackathonLifecycleStatus, getHackathonStatusLabel, getHackathonStatusBadgeClass } from "@/lib/format-hackathon-status"
import type { Database } from "@/types/supabase"

type HackathonWithCounts = Database["public"]["Tables"]["hackathons"]["Row"] & {
  team_count: number
  project_count: number
}

const formatHackathonDate = (date: string | null) => {
  if (!date) return "—"
  return new Date(date).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function AdminHackathonCard({ hackathon }: { hackathon: HackathonWithCounts }) {
  const lifecycleStatus = getHackathonLifecycleStatus(hackathon)

  const formatDate = (date: string | null) => {
    if (!date) return "TBD"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20 group flex flex-col h-full glass border border-white/10">
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
            <CardTitle className="line-clamp-1 text-lg leading-tight text-white">{hackathon.name}</CardTitle>
            <CardDescription className="line-clamp-2 leading-relaxed text-slate-400">
              {hackathon.description}
            </CardDescription>
          </div>
          <Badge className={getHackathonStatusBadgeClass(lifecycleStatus)} variant="secondary">
            {getHackathonStatusLabel(lifecycleStatus)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <div className="flex items-center gap-6 text-sm text-slate-400">
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
      <CardFooter className="pt-0 flex flex-col sm:flex-row gap-2 mt-auto">
        <Button asChild variant="secondary" size="sm" className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 text-slate-200">
          <Link href={`/dashboard/admin/hackathons/${hackathon.id}`}>
            View Details
          </Link>
        </Button>
        <Button asChild variant="default" size="sm" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white">
          <Link href={`/dashboard/admin/hackathons/${hackathon.id}/edit`}>
            Edit
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function HackathonGroup({ title, hackathons }: { title: string; hackathons: HackathonWithCounts[] }) {
  if (hackathons.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg sm:text-xl font-semibold text-white">{title}</h3>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {hackathons.map((h) => (
          <AdminHackathonCard key={h.id} hackathon={h} />
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile()
  const user = await getCurrentUser()
  const role = profile?.role || "team"
  const projectsRepo = new ProjectsRepository()
  const projects = await projectsRepo.findAllWithDetails()
  const hackathonsRepo = new HackathonsRepository()
  const hackathons = await hackathonsRepo.findAllWithCounts()
  const teamsRepo = new TeamsRepository()
  const teams = await teamsRepo.findAll()
  const scoresRepo = new ScoresRepository()
  const scores = await scoresRepo.findAll()
  const profilesRepo = new ProfilesRepository()
  const judges = await profilesRepo.findAllJudges()
  const allProfiles = await profilesRepo.findAll()

  // Group hackathons by lifecycle status for admin
  const registrationOpenHackathons = hackathons.filter(h => getHackathonLifecycleStatus(h) === "registration_open")
  const registrationClosedHackathons = hackathons.filter(h => getHackathonLifecycleStatus(h) === "registration_closed")
  const runningHackathons = hackathons.filter(h => getHackathonLifecycleStatus(h) === "running")
  const judgingHackathons = hackathons.filter(h => getHackathonLifecycleStatus(h) === "judging")
  const completedHackathons = hackathons.filter(h => getHackathonLifecycleStatus(h) === "completed")
  const notStartedHackathons = hackathons.filter(h => getHackathonLifecycleStatus(h) === "not_started")

  // Participant/Team Dashboard
  if (role === "team") {
    const userTeams = user ? await teamsRepo.findByUserId(user.id) : []
    const userTeamsCount = userTeams.length
    const userProjectsCount = (await projectsRepo.findAllWithDetails()).filter(p => {
      return userTeams.some(t => t.id === p.team_id)
    }).length
    const availableHackathonsCount = hackathons.filter(h => h.is_public).length

    return (
      <div className="min-h-screen grid-bg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="font-bold text-2xl sm:text-3xl text-white">Dashboard</h1>
              <p className="text-slate-400 mt-1.5">
                Welcome to HackJudge! Manage your hackathons, teams, and projects here.
              </p>
            </div>
          </div>

          {/* My Hackathon Activity Section */}
          <div className="glass rounded-2xl p-6 border border-white/5 mb-6">
            <h2 className="font-bold text-xl text-white mb-4">My Hackathon Activity</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 rounded-xl bg-white/5">
                <p className="text-3xl font-bold text-white">{userTeamsCount}</p>
                <p className="text-sm text-slate-400 mt-1">Joined Teams</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/5">
                <p className="text-3xl font-bold text-white">{userProjectsCount}</p>
                <p className="text-sm text-slate-400 mt-1">Submitted Projects</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/5">
                <p className="text-3xl font-bold text-white">{availableHackathonsCount}</p>
                <p className="text-sm text-slate-400 mt-1">Available Hackathons</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
              <Button asChild className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20">
                <Link href="/dashboard/hackathons">
                  Browse Hackathons
                </Link>
              </Button>
              <Button asChild variant="secondary" className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 text-slate-200">
                <Link href="/dashboard/teams">
                  My Teams
                </Link>
              </Button>
              <Button asChild variant="secondary" className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 text-slate-200">
                <Link href="/dashboard/projects">
                  My Projects
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/hackathons" className="block">
              <div className="glass rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition-all h-full cursor-pointer">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-lg font-semibold text-white">Available Hackathons</h3>
                  <Trophy className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-400">
                  Find and join hackathons
                </p>
              </div>
            </Link>

            <Link href="/dashboard/teams" className="block">
              <div className="glass rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition-all h-full cursor-pointer">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-lg font-semibold text-white">My Teams</h3>
                  <Users className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-400">
                  View and manage your teams
                </p>
              </div>
            </Link>

            <Link href="/dashboard/projects" className="block">
              <div className="glass rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition-all h-full cursor-pointer">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-lg font-semibold text-white">My Projects</h3>
                  <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-400">
                  View your submitted projects
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Judge Dashboard
  if (role === "judge" && user) {
    const judgesRepo = new JudgesRepository()
    const judgeAssignments = await judgesRepo.findByUserId(user.id)
    const assignedHackathonIds = judgeAssignments.map(a => a.hackathon_id)

    const filteredProjects = projects.filter(p => assignedHackathonIds.includes(p.hackathon_id))
    const totalProjects = filteredProjects.length
    const reviewed = filteredProjects.filter(p => p.average_score !== null).length
    const pendingReview = totalProjects - reviewed
    const averageScore = reviewed > 0 
      ? filteredProjects.filter(p => p.average_score !== null).reduce((acc, p) => acc + (p.average_score || 0), 0) / reviewed 
      : 0
    const completionPercent = totalProjects > 0 ? Math.round((reviewed / totalProjects) * 100) : 0

    return (
      <div className="min-h-screen grid-bg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="font-bold text-2xl sm:text-3xl text-white">Judge Dashboard</h1>
              <p className="text-slate-400 mt-1.5">
                Review and score hackathon projects
              </p>
            </div>
          </div>

          {/* Review Progress Section */}
          <div className="glass rounded-2xl p-6 border border-white/5 mb-6">
            <h2 className="font-bold text-xl text-white mb-4">Review Progress</h2>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <p className="text-3xl font-bold text-white">{totalProjects}</p>
                  <p className="text-sm text-slate-400 mt-1">Total Projects</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <p className="text-3xl font-bold text-white">{reviewed}</p>
                  <p className="text-sm text-slate-400 mt-1">Reviewed</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <p className="text-3xl font-bold text-white">{pendingReview}</p>
                  <p className="text-sm text-slate-400 mt-1">Pending</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <p className="text-3xl font-bold text-white">{completionPercent}%</p>
                  <p className="text-sm text-slate-400 mt-1">Completion</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Progress</span>
                  <span>{completionPercent}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500" 
                    style={{ width: `${completionPercent}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-600/20 to-blue-500/5 border border-blue-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Total Projects</p>
                  <p className="font-bold text-3xl text-white">{totalProjects}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl p-5 bg-gradient-to-br from-cyan-600/20 to-cyan-500/5 border border-cyan-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Reviewed</p>
                  <p className="font-bold text-3xl text-white">{reviewed}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl p-5 bg-gradient-to-br from-purple-600/20 to-purple-500/5 border border-purple-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Pending Review</p>
                  <p className="font-bold text-3xl text-white">{pendingReview}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-600/20 to-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Average Score</p>
                  <p className="font-bold text-3xl text-white">{averageScore.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Projects to Review</h2>

            {assignedHackathonIds.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center border border-white/5">
                <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="font-display font-semibold text-white text-xl mb-2">You are not assigned to any hackathons yet</h3>
                <p className="text-slate-400">Please contact an admin to get assigned to a hackathon.</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center border border-white/5">
                <FileText className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="font-display font-semibold text-white text-xl mb-2">No projects yet</h3>
                <p className="text-slate-400">No projects have been submitted yet for review in your assigned hackathons.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="glass rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition-all h-full">
                    <div className="pb-2">
                      <h3 className="text-lg font-semibold text-white line-clamp-1">{project.name}</h3>
                      {project.tagline && (
                        <p className="text-sm text-slate-400 line-clamp-2 mt-1">{project.tagline}</p>
                      )}
                    </div>
                    <div className="pb-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-500" />
                        <span className="text-xs text-slate-400 line-clamp-1">
                          {project.teams?.name || "No team"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-slate-500" />
                        <span className="text-xs text-slate-400 line-clamp-1">
                          {project.hackathons?.name || "No hackathon"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span className="text-xs text-slate-400">
                          {formatDate(project.created_at)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="default" className="bg-white/5 text-slate-400 border-white/10">
                          {project.status}
                        </Badge>
                        {project.average_score !== null ? (
                          <>
                            <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                              Reviewed
                            </Badge>
                            <Badge variant="default" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                              {project.average_score.toFixed(1)}
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="default" className="bg-white/5 text-slate-400 border-white/10">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="pt-2 flex flex-col gap-2 border-t border-white/5">
                      <Button variant="default" size="sm" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20" asChild>
                        <Link href={`/dashboard/projects/${project.id}/review?returnTo=/dashboard&returnLabel=Back%20to%20Judge%20Dashboard`}>
                          Review Project
                        </Link>
                      </Button>
                      <Button variant="secondary" size="sm" className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 text-slate-200" asChild>
                        <Link href={`/dashboard/projects/${project.id}?returnTo=/dashboard&returnLabel=Back%20to%20Judge%20Dashboard`}>
                          View Details
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Admin Dashboard
  if (role === "admin") {
    return (
      <div className="min-h-screen grid-bg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="font-bold text-xl sm:text-2xl lg:text-3xl text-white">Admin Dashboard</h1>
              <p className="text-slate-400 mt-1.5 text-sm sm:text-base">
                Use this dashboard to manage hackathons, users, judging, teams, and submissions.
              </p>
            </div>
          </div>

          {/* Admin Overview */}
          <div className="space-y-2 mb-6">
            <h2 className="text-xl font-semibold text-white">Admin Overview</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-600/20 to-blue-500/5 border border-blue-500/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Total Hackathons</p>
                    <p className="font-bold text-3xl text-white">{hackathons.length}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-600/20 to-blue-500/5 border border-blue-500/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Total Teams</p>
                    <p className="font-bold text-3xl text-white">{teams.length}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-600/20 to-blue-500/5 border border-blue-500/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Total Projects</p>
                    <p className="font-bold text-3xl text-white">{projects.length}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-600/20 to-blue-500/5 border border-blue-500/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Total Judges</p>
                    <p className="font-bold text-3xl text-white">{judges.length}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-600/20 to-blue-500/5 border border-blue-500/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Total Users</p>
                    <p className="font-bold text-3xl text-white">{allProfiles.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass rounded-2xl p-4 sm:p-6 border border-white/5 mb-8">
            <h2 className="font-bold text-xl text-white mb-4">Quick Actions</h2>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              <Button asChild className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20 w-full justify-start">
                <Link href="/dashboard/hackathons/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Hackathon
                </Link>
              </Button>
              <Button asChild variant="secondary" className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 text-slate-200 w-full justify-start">
                <Link href="/dashboard/leaderboard">
                  <Award className="h-4 w-4 mr-2" />
                  Leaderboard
                </Link>
              </Button>
              <Button asChild variant="secondary" className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 text-slate-200 w-full justify-start">
                <Link href="/dashboard/admin/judges">
                  <UserRound className="h-4 w-4 mr-2" />
                  Manage Judges
                </Link>
              </Button>
            </div>
          </div>

          {/* Hackathons Section */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Active Hackathons</h2>
              <Button asChild variant="secondary" size="default" className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 text-slate-200">
                <Link href="/dashboard/admin/hackathons">
                  View All
                </Link>
              </Button>
            </div>

            <HackathonGroup
              title="Registration Open"
              hackathons={registrationOpenHackathons}
            />
            <HackathonGroup
              title="Starting Soon"
              hackathons={registrationClosedHackathons}
            />
            <HackathonGroup
              title="Running"
              hackathons={runningHackathons}
            />
            <HackathonGroup
              title="Judging"
              hackathons={judgingHackathons}
            />
            <HackathonGroup
              title="Not Started"
              hackathons={notStartedHackathons}
            />
            <HackathonGroup
              title="Completed"
              hackathons={completedHackathons}
            />
          </div>
        </div>
      </div>
    )
  }

  // Fallback to participant dashboard
  return (
    <div className="min-h-screen grid-bg">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-bold text-2xl sm:text-3xl text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1.5">
              Welcome to HackJudge! Manage your hackathons, teams, and projects here.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/dashboard/hackathons" className="block">
            <div className="glass rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition-all h-full cursor-pointer">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-lg font-semibold text-white">Browse Hackathons</h3>
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm text-slate-400">
                Find and join hackathons you're interested in
              </p>
            </div>
          </Link>

          <Link href="/dashboard/teams" className="block">
            <div className="glass rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition-all h-full cursor-pointer">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-lg font-semibold text-white">My Teams</h3>
                <Users className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm text-slate-400">
                View and manage your hackathon teams
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

