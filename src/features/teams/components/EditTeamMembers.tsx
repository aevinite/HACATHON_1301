
"use client"

import { useState, useActionState, useEffect } from "react"
import { Trash2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { addTeamMemberAction, removeTeamMemberAction } from "@/features/teams/server/team-actions"
import type { Database } from "@/types/supabase"
import { useRouter } from "next/navigation"

type Team = Database["public"]["Tables"]["teams"]["Row"]
type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface EditTeamMembersProps {
  team: Team
  members: any[]
  leaderProfile: Profile | null
  isLeader: boolean
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "U"
  return name.split(' ').map(n =&gt; n[0]).join('').toUpperCase().slice(0, 2)
}

export function EditTeamMembers({ team, members, leaderProfile, isLeader }: EditTeamMembersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [addState, addAction, addPending] = useActionState(addTeamMemberAction, { success: undefined, error: undefined })
  const [removeState, removeAction, removePending] = useActionState(removeTeamMemberAction, { success: undefined, error: undefined })
  const router = useRouter()

  useEffect(() =&gt; {
    if (isOpen) {
      setNewMemberEmail("")
    }
  }, [isOpen])

  useEffect(() =&gt; {
    if (addState.success) {
      setNewMemberEmail("")
      router.refresh()
    }
  }, [addState.success, router])

  useEffect(() =&gt; {
    if (removeState.success) {
      router.refresh()
    }
  }, [removeState.success, router])

  const handleAddMember = (e: React.FormEvent) =&gt; {
    e.preventDefault()
    if (!newMemberEmail.trim()) return
    const formData = new FormData()
    formData.set("team_id", team.id)
    formData.set("member_email", newMemberEmail)
    addAction(formData)
  }

  const handleRemoveMember = (userId: string) =&gt; {
    const formData = new FormData()
    formData.set("team_id", team.id)
    formData.set("member_id", userId)
    removeAction(formData)
  }

  return (
    &lt;&gt;
      {isLeader &amp;&amp; (
        &lt;Button 
          variant="default" 
          size="sm" 
          className="ml-auto"
          onClick={() =&gt; setIsOpen(true)}
        &gt;
          &lt;UserPlus className="mr-2 h-4 w-4" /&gt;
          Edit Members
        &lt;/Button&gt;
      )}

      &lt;Dialog open={isOpen} onOpenChange={setIsOpen}&gt;
        &lt;DialogContent className="sm:max-w-[550px]"&gt;
          &lt;DialogHeader&gt;
            &lt;DialogTitle&gt;Edit Team Members&lt;/DialogTitle&gt;
            &lt;DialogDescription&gt;
              Add or remove members from your team.
            &lt;/DialogDescription&gt;
          &lt;/DialogHeader&gt;
          
          &lt;div className="space-y-4"&gt;
            &lt;h4 className="font-semibold text-white"&gt;Add Member&lt;/h4&gt;
            &lt;form onSubmit={handleAddMember} className="flex gap-3"&gt;
              &lt;div className="flex-1"&gt;
                &lt;Input 
                  type="email" 
                  value={newMemberEmail} 
                  onChange={(e) =&gt; setNewMemberEmail(e.target.value)} 
                  placeholder="Enter member email"
                  disabled={addPending}
                /&gt;
              &lt;/div&gt;
              &lt;Button type="submit" disabled={addPending || !newMemberEmail.trim()}&gt;
                {addPending ? "Adding..." : "Add"}
              &lt;/Button&gt;
            &lt;/form&gt;
            {addState.success &amp;&amp; (
              &lt;p className="text-sm text-green-400"&gt;Member added successfully!&lt;/p&gt;
            )}
            {addState.error &amp;&amp; (
              &lt;p className="text-sm text-red-400"&gt;{addState.error}&lt;/p&gt;
            )}
          &lt;/div&gt;

          &lt;div className="space-y-3 mt-4"&gt;
            &lt;h4 className="font-semibold text-white"&gt;Current Members&lt;/h4&gt;
            
            &lt;div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20"&gt;
              &lt;div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center"&gt;
                &lt;span className="text-white text-xs font-bold"&gt;{getInitials(leaderProfile?.full_name)}&lt;/span&gt;
              &lt;/div&gt;
              &lt;div className="flex-1"&gt;
                &lt;p className="text-blue-300 font-medium text-sm"&gt;{leaderProfile?.full_name || "Leader"}&lt;/p&gt;
                &lt;p className="text-xs text-muted-foreground"&gt;Team Leader&lt;/p&gt;
              &lt;/div&gt;
              &lt;Badge className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20"&gt;
                Leader
              &lt;/Badge&gt;
            &lt;/div&gt;

            {members.map((member: any) =&gt; (
              &lt;div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"&gt;
                &lt;div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"&gt;
                  &lt;span className="text-white text-xs font-bold"&gt;{getInitials(member.profiles?.full_name)}&lt;/span&gt;
                &lt;/div&gt;
                &lt;div className="flex-1"&gt;
                  &lt;p className="text-sm font-medium"&gt;{member.profiles?.full_name || "Member"}&lt;/p&gt;
                &lt;/div&gt;
                {isLeader &amp;&amp; (
                  &lt;Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() =&gt; handleRemoveMember(member.user_id)}
                    disabled={removePending}
                  &gt;
                    &lt;Trash2 className="h-4 w-4" /&gt;
                  &lt;/Button&gt;
                )}
              &lt;/div&gt;
            ))}
          &lt;/div&gt;

          {removeState.success &amp;&amp; (
            &lt;p className="text-sm text-green-400"&gt;Member removed successfully!&lt;/p&gt;
          )}
          {removeState.error &amp;&amp; (
            &lt;p className="text-sm text-red-400"&gt;{removeState.error}&lt;/p&gt;
          )}

          &lt;DialogFooter&gt;
            &lt;Button type="button" variant="secondary" onClick={() =&gt; setIsOpen(false)}&gt;
              Close
            &lt;/Button&gt;
          &lt;/DialogFooter&gt;
        &lt;/DialogContent&gt;
      &lt;/Dialog&gt;
    &lt;/&gt;
  )
}
