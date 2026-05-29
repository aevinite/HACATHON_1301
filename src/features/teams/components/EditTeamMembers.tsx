"use client"

import { useState, useActionState, useEffect } from "react"
import { Trash2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { addTeamMemberAction, removeTeamMemberAction } from "@/features/teams/server/team-actions"
import type { Database } from "@/types/supabase"

type Team = Database["public"]["Tables"]["teams"]["Row"]
type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type TeamMember = Database["public"]["Tables"]["team_members"]["Row"]

type TeamMemberWithProfile = TeamMember & {
  profiles?: Profile | null
}

interface EditTeamMembersProps {
  team: Team
  members: TeamMemberWithProfile[]
  leaderProfile: Profile | null
  isLeader: boolean
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "U"
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function EditTeamMembers({ team, members, leaderProfile, isLeader }: EditTeamMembersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [addState, addAction, addPending] = useActionState(addTeamMemberAction, { success: undefined, error: undefined })
  const [removeState, removeAction, removePending] = useActionState(removeTeamMemberAction, { success: undefined, error: undefined })

  // Reset success/error states when dialog opens
  useEffect(() => {
    if (isOpen) {
      setNewMemberEmail("")
    }
  }, [isOpen])

  // Handle successful add - don't close dialog immediately, keep it open so user can see updated list
  useEffect(() => {
    if (addState.success) {
      setNewMemberEmail("")
    }
  }, [addState.success])

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemberEmail.trim()) return
    const formData = new FormData()
    formData.set("team_id", team.id)
    formData.set("member_email", newMemberEmail)
    addAction(formData)
  }

  const handleRemoveMember = (userId: string) => {
    const formData = new FormData()
    formData.set("team_id", team.id)
    formData.set("member_id", userId)
    removeAction(formData)
  }

  return (
    <>
      {isLeader && (
        <Button 
          variant="default" 
          size="sm" 
          className="ml-auto"
          onClick={() => setIsOpen(true)}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Edit Members
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Team Members</DialogTitle>
            <DialogDescription>
              Add or remove members from your team.
            </DialogDescription>
          </DialogHeader>
          
          {/* Add New Member */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Add Member</h4>
            <form onSubmit={handleAddMember} className="flex gap-3">
              <div className="flex-1">
                <Input 
                  type="email" 
                  value={newMemberEmail} 
                  onChange={(e) => setNewMemberEmail(e.target.value)} 
                  placeholder="Enter member email"
                  disabled={addPending}
                />
              </div>
              <Button type="submit" disabled={addPending || !newMemberEmail.trim()}>
                {addPending ? "Adding..." : "Add"}
              </Button>
            </form>
            {addState.success && (
              <p className="text-sm text-green-400">Member added successfully!</p>
            )}
            {addState.error && (
              <p className="text-sm text-red-400">{addState.error}</p>
            )}
          </div>

          {/* Current Members */}
          <div className="space-y-3 mt-4">
            <h4 className="font-semibold text-white">Current Members</h4>
            
            {/* Leader */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{getInitials(leaderProfile?.full_name)}</span>
              </div>
              <div className="flex-1">
                <p className="text-blue-300 font-medium text-sm">{leaderProfile?.full_name || "Leader"}</p>
                <p className="text-xs text-muted-foreground">Team Leader</p>
              </div>
              <Badge className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Leader
              </Badge>
            </div>

            {/* Other Members */}
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{getInitials(member.profiles?.full_name)}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{member.profiles?.full_name || "Member"}</p>
                </div>
                {isLeader && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleRemoveMember(member.user_id)}
                    disabled={removePending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {removeState.success && (
            <p className="text-sm text-green-400">Member removed successfully!</p>
          )}
          {removeState.error && (
            <p className="text-sm text-red-400">{removeState.error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
