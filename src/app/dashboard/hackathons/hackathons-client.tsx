
"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Trophy, Plus, Search } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { HackathonCard } from "@/components/hackathon-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Database } from "@/types/supabase"
import {
  getHackathonLifecycleStatus,
  getHackathonGroupBucket,
  getHackathonGroupLabel
} from "@/lib/format-hackathon-status"

type Hackathon = Database["public"]["Tables"]["hackathons"]["Row"] & {
  userTeam?: any | null
  isParticipating?: boolean
}

interface HackathonsClientProps {
  initialHackathons: Hackathon[]
  showCreateButton?: boolean
}

export default function HackathonsClient({ initialHackathons, showCreateButton = true }: HackathonsClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredHackathons = useMemo(() => {
    return initialHackathons.filter(hackathon => {
      const matchesSearch = 
        hackathon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (hackathon.description && hackathon.description.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const lifecycleStatus = getHackathonLifecycleStatus(hackathon)
      const matchesStatus = statusFilter === "all" || lifecycleStatus === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [initialHackathons, searchQuery, statusFilter])

  const currentActiveHackathons = useMemo(() => 
    filteredHackathons.filter(h => getHackathonGroupBucket(h) === "current_active"),
  [filteredHackathons])

  const upcomingNotStartedHackathons = useMemo(() => 
    filteredHackathons.filter(h => getHackathonGroupBucket(h) === "upcoming_not_started"),
  [filteredHackathons])

  const finishedCompletedHackathons = useMemo(() => 
    filteredHackathons.filter(h => getHackathonGroupBucket(h) === "finished_completed"),
  [filteredHackathons])

  const renderHackathonCards = (hackathons: Hackathon[]) => (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {hackathons.map((hackathon) => (
        <HackathonCard 
          key={hackathon.id} 
          hackathon={hackathon} 
          returnTo="/dashboard/hackathons" 
          returnLabel="Back to Hackathons"
          isParticipating={hackathon.isParticipating || false}
          team={hackathon.userTeam}
        />
      ))}
    </div>
  )

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 lg:mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking tracking-tight">Hackathons</h1>
            <p className="text-muted-foreground mt-2 text-base">
              Explore and participate in hackathons
            </p>
          </div>
          {showCreateButton && (
            <Link href="/dashboard/hackathons/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Hackathon
              </Button>
            </Link>
          )}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search hackathons by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="registration_open">Registration Open</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="judging">Judging</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredHackathons.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <EmptyState
              icon={Trophy}
              title={initialHackathons.length === 0 ? "No hackathons yet" : "No hackathons match your search"}
              description={
                initialHackathons.length === 0 
                  ? "Create or join a hackathon to get started" 
                  : "Try adjusting your search or filter criteria"
              }
              className="max-w-md"
            />
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
    </div>
  )
}

