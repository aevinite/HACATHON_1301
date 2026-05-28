
"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Search, Plus, Trash2 } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { assignJudgeToHackathon, unassignJudgeFromHackathon } from "@/features/judges/server/actions"
import { useRouter } from "next/navigation"

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date)
}

type Hackathon = {
  id: string
  name: string
}

type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
  email?: string | null
  assignments: Array<{
    id: string
    hackathon_id: string
    hackathons: {
      id: string
      name: string
    } | null
  }>
}

interface AdminJudgesClientProps {
  initialJudges: Profile[]
  hackathons: Hackathon[]
}

export default function AdminJudgesClient({ initialJudges, hackathons }: AdminJudgesClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [selectedHackathons, setSelectedHackathons] = useState<{ [key: string]: string }>({})
  const router = useRouter()

  const stats = useMemo(() => {
    const total = initialJudges.length
    const assigned = initialJudges.filter(j => j.assignments.length > 0).length
    const unassigned = initialJudges.filter(j => j.assignments.length === 0).length
    return { total, assigned, unassigned }
  }, [initialJudges])

  const filteredJudges = useMemo(() => {
    return initialJudges.filter(judge => {
      const matchesSearch = 
        (judge.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (judge.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
      const matchesFilter = 
        filter === "all" ||
        (filter === "assigned" && judge.assignments.length > 0) ||
        (filter === "unassigned" && judge.assignments.length === 0)
      return matchesSearch && matchesFilter
    })
  }, [initialJudges, searchQuery, filter])

  const handleAssign = async (judgeId: string) => {
    const hackathonId = selectedHackathons[judgeId]
    if (!hackathonId) return
    
    try {
      await assignJudgeToHackathon(judgeId, hackathonId)
      setSelectedHackathons(prev => ({ ...prev, [judgeId]: "" }))
      router.refresh()
    } catch (error) {
      console.error(error)
    }
  }

  const handleUnassign = async (assignmentId: string) => {
    try {
      await unassignJudgeFromHackathon(assignmentId)
      router.refresh()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="space-y-6 min-h-screen grid-bg">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <AdminPageHeader
            title="Manage Judges"
            description="View and manage judge assignments"
          />
          <Link href="/dashboard/admin/users" passHref legacyBehavior>
            <Button asChild variant="default">
              <a className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Judge
              </a>
            </Button>
          </Link>
        </div>
        <div className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-sm text-blue-400">
            To add a judge, first create/sign up a user, then convert their role to judge from Manage Users.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-600/20 to-blue-500/5 border border-blue-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Judges</p>
              <p className="font-bold text-3xl text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-600/20 to-blue-500/5 border border-blue-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Assigned</p>
              <p className="font-bold text-3xl text-white">{stats.assigned}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-600/20 to-blue-500/5 border border-blue-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Unassigned</p>
              <p className="font-bold text-3xl text-white">{stats.unassigned}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search judges by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by assignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Judges</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredJudges.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-white">
            {initialJudges.length === 0 ? "No judges yet. Invite judges after auth invite setup is configured." : "No judges match your search"}
          </p>
          <p className="text-slate-400 mt-1">
            {initialJudges.length === 0 
              ? "Judge invite requires auth invite setup." 
              : "Try adjusting your search criteria"
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredJudges.map((judge) => (
            <div key={judge.id} className="glass rounded-2xl p-6 border border-white/10 hover:border-blue-500/40 transition-all hover:shadow-xl hover:shadow-blue-500/10">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold line-clamp-1 text-white">
                      {judge.full_name || "Judge"}
                    </h3>
                    <Badge variant="default" className="bg-purple-500/10 text-purple-400 border border-purple-500/20">Judge</Badge>
                  </div>
                  {judge.email && (
                    <p className="text-sm text-slate-400">{judge.email}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">Joined {formatDate(judge.created_at)}</p>
                </div>
              </div>
              
              <div className="space-y-4 pt-4">
                <div>
                  <p className="text-sm text-slate-400 mb-3">Assignments:</p>
                  <div className="flex flex-wrap gap-2">
                    {judge.assignments.length === 0 ? (
                      <Badge variant="default" className="bg-white/5 text-slate-400 border-white/10">
                        No assignments yet
                      </Badge>
                    ) : (
                      judge.assignments.map(assignment => (
                        <div key={assignment.id} className="flex items-center gap-2">
                          <Badge 
                            variant="default" 
                            className="bg-blue-500/10 text-blue-400 border-blue-500/20"
                          >
                            {assignment.hackathons?.name}
                          </Badge>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 w-8 p-0 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                            onClick={() => handleUnassign(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center pt-2">
                  <Select
                    value={selectedHackathons[judge.id] || ""}
                    onValueChange={(val) => setSelectedHackathons(prev => ({ ...prev, [judge.id]: val }))}
                  >
                    <SelectTrigger className="w-full sm:w-[280px]">
                      <SelectValue placeholder="Select a hackathon to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {hackathons.map(hackathon => {
                        const isAssigned = judge.assignments.some(a => a.hackathon_id === hackathon.id)
                        if (isAssigned) return null
                        return (
                          <SelectItem key={hackathon.id} value={hackathon.id}>
                            {hackathon.name}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="default"
                    size="sm"
                    disabled={!selectedHackathons[judge.id]}
                    onClick={() => handleAssign(judge.id)}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Assign
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
