
"use client"

import { useState, useMemo, useActionState, useRef } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Trophy, Plus, Trash2, AlertTriangle, Edit, Eye } from "lucide-react"
import { deleteHackathonAction } from "@/features/hackathons/server/actions"
import { updateResultVisibilityAction } from "@/features/hackathons/server/actions"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { 
  getHackathonLifecycleStatus, 
  getHackathonStatusLabel, 
  getHackathonStatusBadgeClass,
  getHackathonGroupBucket,
  getHackathonGroupLabel,
  isHackathonNotStarted
} from "@/lib/format-hackathon-status"

type Hackathon = {
  id: string
  name: string
  description: string
  status: string
  is_public: boolean
  start_date: string | null
  submission_deadline: string | null
  created_at: string
  team_count: number
  project_count: number
  results_published: boolean
  results_visible_to_judges: boolean
  results_visible_to_participants: boolean
}

interface AdminHackathonsClientProps {
  initialHackathons: Hackathon[]
}

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

const getStatusLabel = (status: string) => {
  switch (status) {
    case "draft":
      return "Not Started"
    case "registration":
      return "Not Started"
    case "submission":
      return "Running"
    case "judging":
      return "Judging"
    case "completed":
      return "Completed"
    default:
      return status
  }
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "draft":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    case "registration":
      return "bg-green-500/10 text-green-400 border-green-500/20"
    case "submission":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20"
    case "judging":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20"
    case "completed":
      return "bg-slate-500/10 text-slate-400 border-slate-500/20"
    default:
      return "bg-white/5 text-slate-400 border-white/10"
  }
}

function getResultStatusLabel(hackathon: Hackathon): string {
  if (hackathon.results_visible_to_participants) {
    return "Published"
  } else if (hackathon.results_visible_to_judges) {
    return "Published to Judges Only"
  } else {
    return "Not Published"
  }
}

function getResultStatusBadgeClass(status: string) {
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

function DeleteHackathonButton({ hackathonId, hackathonName }: { hackathonId: string; hackathonName: string }) {
  const [state, formAction, isPending] = useActionState(deleteHackathonAction, { error: undefined })
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  function handleConfirmDelete() {
    if (formRef.current) {
      formRef.current.requestSubmit()
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <DialogTitle>Delete hackathon?</DialogTitle>
              </div>
            </div>
            <DialogDescription asChild>
              <div className="pt-4 text-sm text-muted-foreground">
                <div className="mb-2">You are about to delete:</div>
                <div className="font-medium text-foreground mb-4">"{hackathonName}"</div>
                <div>
                  This action cannot be undone. If this hackathon already has teams or projects, deletion may fail.
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          {state.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete Hackathon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <form ref={formRef} action={formAction} className="hidden">
        <input type="hidden" name="id" value={hackathonId} />
      </form>
    </div>
  )
}

function ResultVisibilityControls({ hackathon }: { hackathon: Hackathon }) {
  const [selectedVisibility, setSelectedVisibility] = useState<string>(getVisibilityValue(hackathon))
  const [state, formAction, isPending] = useActionState(updateResultVisibilityAction, { error: undefined, success: undefined })
  const formRef = useRef<HTMLFormElement>(null)

  function handleSave() {
    if (formRef.current) {
      formRef.current.requestSubmit()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="default" className={getResultStatusBadgeClass(getResultStatusLabel(hackathon))}>
        {getResultStatusLabel(hackathon)}
      </Badge>
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
  )
}

export default function AdminHackathonsClient({ initialHackathons }: AdminHackathonsClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const stats = useMemo(() => {
    const total = initialHackathons.length
    const notStarted = initialHackathons.filter(h => 
      isHackathonNotStarted(h as any)
    ).length
    const active = initialHackathons.filter(h => 
      getHackathonGroupBucket(h as any) === "current_active"
    ).length
    const completed = initialHackathons.filter(h => 
      getHackathonGroupBucket(h as any) === "finished_completed"
    ).length
    return { total, notStarted, active, completed }
  }, [initialHackathons])

  const filteredHackathons = useMemo(() => {
    return initialHackathons.filter(hackathon => {
      const matchesSearch = hackathon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hackathon.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || hackathon.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [initialHackathons, searchQuery, statusFilter])

  const currentActiveHackathons = useMemo(() => 
    filteredHackathons.filter(h => getHackathonGroupBucket(h as any) === "current_active"),
  [filteredHackathons])

  const upcomingNotStartedHackathons = useMemo(() => 
    filteredHackathons.filter(h => getHackathonGroupBucket(h as any) === "upcoming_not_started"),
  [filteredHackathons])

  const finishedCompletedHackathons = useMemo(() => 
    filteredHackathons.filter(h => getHackathonGroupBucket(h as any) === "finished_completed"),
  [filteredHackathons])

  const renderHackathonCards = (hackathons: Hackathon[]) => (
    <div className="grid gap-4">
      {hackathons.map((hackathon) => (
        <div key={hackathon.id} className="glass rounded-2xl p-6 border border-white/10 hover:border-blue-500/40 transition-all hover:shadow-xl hover:shadow-blue-500/10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-white">{hackathon.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className={getHackathonStatusBadgeClass(getHackathonLifecycleStatus(hackathon as any))}>
                    {getHackathonStatusLabel(getHackathonLifecycleStatus(hackathon as any))}
                  </Badge>
                  {hackathon.is_public && (
                    <Badge variant="default" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                      Public
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                {hackathon.description}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl p-3 bg-white/5 border border-white/5">
                  <p className="text-xs text-slate-500 mb-1">Teams</p>
                  <p className="text-xl font-bold text-white">{hackathon.team_count}</p>
                </div>
                <div className="rounded-xl p-3 bg-white/5 border border-white/5">
                  <p className="text-xs text-slate-500 mb-1">Projects</p>
                  <p className="text-xl font-bold text-white">{hackathon.project_count}</p>
                </div>
                <div className="rounded-xl p-3 bg-white/5 border border-white/5">
                  <p className="text-xs text-slate-500 mb-1">Start</p>
                  <p className="text-sm font-medium text-slate-300">{formatDate(hackathon.start_date)}</p>
                </div>
                <div className="rounded-xl p-3 bg-white/5 border border-white/5">
                  <p className="text-xs text-slate-500 mb-1">Deadline</p>
                  <p className="text-sm font-medium text-slate-300">{formatDate(hackathon.submission_deadline)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-white/10 flex flex-wrap gap-2 justify-between items-center">
            <ResultVisibilityControls hackathon={hackathon} />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" asChild className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 text-slate-200">
                <Link href={`/dashboard/hackathons/${hackathon.id}?returnTo=/dashboard/admin/hackathons&returnLabel=Back%20to%20Manage%20Hackathons`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </Button>
              <Button variant="secondary" size="sm" asChild className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 text-slate-200">
                <Link href={`/dashboard/admin/hackathons/${hackathon.id}/edit?returnTo=/dashboard/admin/hackathons&returnLabel=Back%20to%20Manage%20Hackathons`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <DeleteHackathonButton hackathonId={hackathon.id} hackathonName={hackathon.name} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6 min-h-screen grid-bg">
      <AdminPageHeader
        title="Manage Hackathons"
        description="Create and manage all hackathons on the platform"
        action={{
          label: "Create Hackathon",
          href: "/dashboard/hackathons/new?returnTo=/dashboard/admin/hackathons&returnLabel=Back%20to%20Manage%20Hackathons"
        }}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-600/20 to-blue-500/5 border border-blue-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Hackathons</p>
              <p className="font-bold text-3xl text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-gradient-to-br from-cyan-600/20 to-cyan-500/5 border border-cyan-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Active</p>
              <p className="font-bold text-3xl text-white">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-gradient-to-br from-yellow-600/20 to-yellow-500/5 border border-yellow-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Not Started</p>
              <p className="font-bold text-3xl text-white">{stats.notStarted}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-600/20 to-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Completed</p>
              <p className="font-bold text-3xl text-white">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search hackathons by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="draft">Not Started</SelectItem>
            <SelectItem value="registration">Not Started</SelectItem>
            <SelectItem value="submission">Running</SelectItem>
            <SelectItem value="judging">Judging</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredHackathons.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Trophy className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-white">
            {initialHackathons.length === 0 ? "No hackathons yet" : "No hackathons match your filters"}
          </p>
          <p className="text-slate-400 mt-1">
            {initialHackathons.length === 0 
              ? "Create your first hackathon to get started!" 
              : "Try adjusting your search or filter criteria"
            }
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {currentActiveHackathons.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-blue-400">●</span> {getHackathonGroupLabel("current_active")}
              </h2>
              {renderHackathonCards(currentActiveHackathons)}
            </div>
          )}
          
          {upcomingNotStartedHackathons.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-green-400">●</span> {getHackathonGroupLabel("upcoming_not_started")}
              </h2>
              {renderHackathonCards(upcomingNotStartedHackathons)}
            </div>
          )}
          
          {finishedCompletedHackathons.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-emerald-400">●</span> {getHackathonGroupLabel("finished_completed")}
              </h2>
              {renderHackathonCards(finishedCompletedHackathons)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
