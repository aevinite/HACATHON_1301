
"use client"

import { useState, useMemo, useActionState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, AlertTriangle, CheckCircle2 } from "lucide-react"
import { updateUserRoleAction } from "@/features/auth/server/admin-actions"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

type Profile = {
  id: string
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string
}

interface AdminUsersClientProps {
  initialProfiles: Profile[]
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case "admin":
      return "Admin"
    case "team":
      return "Participant"
    case "judge":
      return "Judge"
    default:
      return role
  }
}

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case "admin":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20"
    case "judge":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20"
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20"
  }
}

function UpdateRoleForm({ profileId, currentRole }: { profileId: string; currentRole: string }) {
  const [state, formAction, isPending] = useActionState(updateUserRoleAction, { success: undefined, error: undefined })
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedRole, setSelectedRole] = useState(currentRole)
  const [isDirty, setIsDirty] = useState(false)

  function handleRoleChange(role: string) {
    setSelectedRole(role)
    setIsDirty(role !== currentRole)
  }

  function handleSubmit() {
    if (formRef.current && isDirty) {
      formRef.current.requestSubmit()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <form ref={formRef} action={formAction} className="hidden">
        <input type="hidden" name="userId" value={profileId} />
        <input type="hidden" name="role" value={selectedRole} />
      </form>
      <div className="flex items-center gap-3">
        <Select 
          value={selectedRole} 
          onValueChange={handleRoleChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="team">Participant</SelectItem>
            <SelectItem value="judge">Judge</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          onClick={handleSubmit} 
          disabled={!isDirty || isPending}
          size="sm"
        >
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
      {state.success && (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          Role updated successfully
        </div>
      )}
      {state.error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4" />
          {state.error}
        </div>
      )}
    </div>
  )
}

export default function AdminUsersClient({ initialProfiles }: AdminUsersClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  const stats = useMemo(() => {
    const total = initialProfiles.length
    const admins = initialProfiles.filter(p => p.role === "admin").length
    const judges = initialProfiles.filter(p => p.role === "judge").length
    const participants = initialProfiles.filter(p => p.role === "team").length
    return { total, admins, judges, participants }
  }, [initialProfiles])

  const filteredProfiles = useMemo(() => {
    return initialProfiles.filter(profile => {
      const matchesSearch = (profile.full_name || "").toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === "all" || profile.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [initialProfiles, searchQuery, roleFilter])

  return (
    <div className="space-y-6 min-h-screen grid-bg">
      <AdminPageHeader
        title="Manage Users"
        description="View and manage user roles on the platform"
      />
      
      <div className="rounded-2xl p-5 bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-300">Important Note</p>
            <p className="text-sm text-amber-200 mt-1">
              Changing a user role changes their dashboard access. It does not delete their teams, projects, or submissions.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-slate-600/20 to-slate-500/5 border border-slate-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Users</p>
              <p className="font-bold text-3xl text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-gradient-to-br from-purple-600/20 to-purple-500/5 border border-purple-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Admins</p>
              <p className="font-bold text-3xl text-white">{stats.admins}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-600/20 to-blue-500/5 border border-blue-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Judges</p>
              <p className="font-bold text-3xl text-white">{stats.judges}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-600/20 to-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Participants</p>
              <p className="font-bold text-3xl text-white">{stats.participants}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search users by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="team">Participant</SelectItem>
            <SelectItem value="judge">Judge</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredProfiles.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-white">
            {initialProfiles.length === 0 ? "No users yet" : "No users match your filters"}
          </p>
          <p className="text-slate-400 mt-1">
            {initialProfiles.length === 0 
              ? "Users will appear here as they sign up" 
              : "Try adjusting your search or filter criteria"
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProfiles.map((profile) => (
            <div 
              key={profile.id} 
              className="glass rounded-2xl p-6 border border-white/10 hover:border-blue-500/40 transition-all hover:shadow-xl hover:shadow-blue-500/10"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">
                      {profile.full_name || "Unnamed User"}
                    </h3>
                    <Badge variant="default" className={getRoleBadgeClass(profile.role)}>
                      {getRoleLabel(profile.role)}
                    </Badge>
                    {!profile.is_active && (
                      <Badge variant="default" className="bg-red-500/10 text-red-400 border-red-500/20">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">
                    User ID: {profile.id}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <UpdateRoleForm profileId={profile.id} currentRole={profile.role} />
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  >
                    Delete User (Coming Soon)
                  </Button>
                  <p className="text-xs text-slate-500">
                    User deletion is disabled until safe auth deletion and data-retention rules are implemented.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

