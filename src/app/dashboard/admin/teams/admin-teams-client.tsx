
"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Trophy, Calendar, Eye, User, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

type TeamWithDetails = {
  id: string
  name: string
  hackathon_id: string
  leader_id: string
  created_at: string
  hackathons: { name: string } | null
  profiles: { id: string; full_name: string | null; avatar_url: string | null; role: string; is_active: boolean; created_at: string; updated_at: string; email?: string | null } | null
}

interface AdminTeamsClientProps {
  initialTeams: TeamWithDetails[]
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

export default function AdminTeamsClient({ initialTeams, initialHackathonId, hackathonName }: AdminTeamsClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [hackathonIdFilter, setHackathonIdFilter] = useState(initialHackathonId)

  const stats = useMemo(() => {
    const total = initialTeams.length
    const withHackathon = initialTeams.filter(t => t.hackathon_id !== null).length
    const withoutHackathon = total - withHackathon
    return { total, withHackathon, withoutHackathon }
  }, [initialTeams])

  const filteredTeams = useMemo(() => {
    return initialTeams.filter(team => {
      const matchesSearch = 
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (team.hackathons && team.hackathons.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (team.profiles && (
          (team.profiles.full_name && team.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (team.profiles.email && team.profiles.email.toLowerCase().includes(searchQuery.toLowerCase()))
        ))
      
      const matchesHackathon = !hackathonIdFilter || team.hackathon_id === hackathonIdFilter
      
      return matchesSearch && matchesHackathon
    })
  }, [initialTeams, searchQuery, hackathonIdFilter])

  return (
    <div className="space-y-6 min-h-screen grid-bg">
      {hackathonIdFilter && hackathonName && (
        <div className="glass rounded-2xl p-4 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600/20 to-blue-500/5 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Showing teams for</p>
              <p className="text-lg font-bold text-white">{hackathonName}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" asChild className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 text-slate-200">
            <Link href="/dashboard/admin/teams">
              Clear filter
            </Link>
          </Button>
        </div>
      )}
      <AdminPageHeader
        title="Manage Teams"
        description="View all teams registered on the platform"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-600/20 to-blue-500/5 border border-blue-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Teams</p>
              <p className="font-bold text-3xl text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-gradient-to-br from-cyan-600/20 to-cyan-500/5 border border-cyan-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">With Hackathon</p>
              <p className="font-bold text-3xl text-white">{stats.withHackathon}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-gradient-to-br from-purple-600/20 to-purple-500/5 border border-purple-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Without Hackathon</p>
              <p className="font-bold text-3xl text-white">{stats.withoutHackathon}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search teams by name, hackathon, or leader..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredTeams.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-white">
            {hackathonIdFilter 
              ? "No teams found for this hackathon" 
              : (initialTeams.length === 0 ? "No teams yet" : "No teams match your search")}
          </p>
          <p className="text-slate-400 mt-1">
            {hackathonIdFilter 
              ? "This hackathon doesn't have any teams yet!" 
              : (initialTeams.length === 0 
                ? "Teams will appear here once participants start creating them!" 
                : "Try adjusting your search criteria")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTeams.map((team) => (
            <div key={team.id} className="glass rounded-2xl p-6 border border-white/10 hover:border-blue-500/40 transition-all hover:shadow-xl hover:shadow-blue-500/10">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-4">{team.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {team.hackathons && (
                      <div className="rounded-xl p-3 bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className="h-4 w-4 text-slate-500" />
                          <p className="text-xs text-slate-500">Hackathon</p>
                        </div>
                        <p className="text-sm font-medium text-slate-300 line-clamp-1">
                          {team.hackathons.name}
                        </p>
                      </div>
                    )}
                    {team.profiles && (
                      <div className="rounded-xl p-3 bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-slate-500" />
                          <p className="text-xs text-slate-500">Leader</p>
                        </div>
                        <p className="text-sm font-medium text-slate-300 line-clamp-1">
                          {team.profiles.full_name || team.profiles.email || team.leader_id.slice(0, 8)}...
                        </p>
                      </div>
                    )}
                    <div className="rounded-xl p-3 bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <p className="text-xs text-slate-500">Created</p>
                      </div>
                      <p className="text-sm font-medium text-slate-300">
                        {formatDate(team.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-white/10 flex flex-wrap gap-2 justify-end">
                {team.hackathons && (
                  <Button variant="secondary" size="sm" asChild className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 text-slate-200">
                    <Link href={`/dashboard/hackathons/${team.hackathon_id}?returnTo=/dashboard/admin/teams&returnLabel=Back%20to%20Manage%20Teams`}>
                      <Trophy className="h-4 w-4 mr-2" />
                      View Hackathon
                    </Link>
                  </Button>
                )}
                <Button variant="default" size="sm" asChild className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20">
                  <Link href={`/dashboard/teams/${team.id}?returnTo=/dashboard/admin/teams&returnLabel=Back%20to%20Manage%20Teams`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Team
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
