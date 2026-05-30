
"use client"

import { useActionState, useEffect, useState } from "react"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { joinHackathonAction } from "@/features/hackathons/server/join-action"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Database } from "@/types/supabase"
import { isHackathonRegistrationOpen } from "@/lib/format-hackathon-status"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

type Hackathon = Database["public"]["Tables"]["hackathons"]["Row"]
type Team = Database["public"]["Tables"]["teams"]["Row"]
type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface JoinHackathonButtonProps {
  hackathonId: string
  isParticipating: boolean
  hackathon: Hackathon
  team?: Team | null
}

interface JoinActionState {
  error?: string
  teamId?: string
  hackathonId?: string
  isNewTeam?: boolean
}

interface MemberInput {
  id: number
  email: string
}

export function JoinHackathonButton({ hackathonId, isParticipating, hackathon, team }: JoinHackathonButtonProps) {
  const [state, formAction, isPending] = useActionState<JoinActionState, FormData>(joinHackathonAction, { error: undefined, teamId: undefined, hackathonId: undefined, isNewTeam: undefined })
  const router = useRouter()
  const registrationOpen = isHackathonRegistrationOpen(hackathon)
  const now = new Date()
  const hackathonStarted = hackathon.start_date ? now >= new Date(hackathon.start_date) : false
  const [isOpen, setIsOpen] = useState(false)
  const [teamName, setTeamName] = useState("")
  const [memberCount, setMemberCount] = useState("1")
  const [memberInputs, setMemberInputs] = useState<MemberInput[]>([])
  const [showTeamCreated, setShowTeamCreated] = useState(false)

  // Initialize member inputs when member count changes
  useEffect(() => {
    const count = parseInt(memberCount)
    const newInputs: MemberInput[] = []
    for (let i = 0; i < count - 1; i++) { // minus 1 because current user is already a member
      newInputs.push({ id: i, email: "" })
    }
    setMemberInputs(newInputs)
  }, [memberCount])

  useEffect(() => {
    if (state.teamId && state.hackathonId && !showTeamCreated) {
      setShowTeamCreated(true)
      // Don't navigate away immediately - let user see the team
    }
  }, [state.teamId, state.hackathonId, state.isNewTeam, router])

  const getButtonText = () => {
    if (!isParticipating && !registrationOpen) {
      if (hackathonStarted) {
        return "Hackathon Running"
      }
      return "Registration Closed"
    }
    return "Join Hackathon"
  }

  if (isParticipating) {
    return (
      <div className="flex-1 w-full">
        {team ? (
          <Button asChild variant="secondary" size="default" className="w-full">
            <Link href={`/dashboard/teams/${team.id}?returnTo=/dashboard/hackathons/${hackathonId}&returnLabel=Back%20to%20Hackathon`} className="w-full">
              <Users className="mr-2 h-4 w-4" />
              Participating
            </Link>
          </Button>
        ) : (
          <Button disabled variant="secondary" size="default" className="w-full">
            <Users className="mr-2 h-4 w-4" />
            Participating
          </Button>
        )}
      </div>
    )
  }

  if (!registrationOpen) {
    return null
  }

  const handleJoinClick = () => {
    // Reset states when opening dialog
    setTeamName("My Team")
    const defaultCount = hackathon.min_team_size || 1
    setMemberCount(defaultCount.toString())
    setShowTeamCreated(false)
    setIsOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Create a FormData object and trigger the action
    const formData = new FormData()
    formData.set("hackathon_id", hackathonId)
    formData.set("team_name", teamName)
    formData.set("member_count", memberCount)
    
    memberInputs.forEach((member, index) => {
      console.log(`Adding member_email_${index}:`, member.email)
      formData.set(`member_email_${index}`, member.email)
    })
    
    // @ts-ignore
    formAction(formData)
  }

  const updateMemberEmail = (index: number, email: string) => {
    const newInputs = [...memberInputs]
    newInputs[index].email = email
    setMemberInputs(newInputs)
  }

  const goToTeamPage = () => {
    if (state.teamId && state.hackathonId) {
      const queryParams = new URLSearchParams()
      queryParams.set("setup", "1")
      queryParams.set("returnTo", `/dashboard/hackathons/${state.hackathonId}`)
      queryParams.set("returnLabel", "Back to Hackathon")
      if (state.isNewTeam) {
        queryParams.set("new", "1")
      }
      router.push(`/dashboard/teams/${state.teamId}?${queryParams.toString()}`)
    }
  }

  return (
    <div className="flex-1 w-full">
      <Button 
        onClick={handleJoinClick}
        variant="default"
        size="default"
        className="w-full"
      >
        Join Hackathon
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Join Hackathon</DialogTitle>
            <DialogDescription>
              Create your team to join the hackathon.
            </DialogDescription>
          </DialogHeader>
          
          {showTeamCreated ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <h4 className="text-green-400 font-medium mb-2">Team Created Successfully!</h4>
                <p className="text-sm text-white">{teamName}</p>
              </div>
              
              {/* Show team members like judging criteria */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white">Your Team Members:</h4>
                <div className="p-3 border rounded-md bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">U</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-300">You (Leader)</p>
                    </div>
                    <Badge className="ml-auto text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Leader
                    </Badge>
                  </div>
                </div>
                
                {memberInputs.filter(m => m.email.trim() !== "").map((member, i) => (
                  <div key={member.id} className="p-3 border rounded-md bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">M</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <DialogFooter className="mt-4">
                <Button variant="secondary" onClick={() => setIsOpen(false)}>
                  Close
                </Button>
                <Button onClick={goToTeamPage}>
                  Go to Team Page
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="team-name" className="text-right">
                    Team Name
                  </Label>
                  <Input
                    id="team-name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="col-span-3"
                    placeholder="Enter your team name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="member-count" className="text-right">
                    Team Size
                  </Label>
                  <Select value={memberCount} onValueChange={setMemberCount}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const minSize = hackathon.min_team_size || 1
                        const maxSize = hackathon.max_team_size || 5
                        const options = []
                        for (let i = minSize; i <= maxSize; i++) {
                          options.push(
                            <SelectItem key={i} value={i.toString()}>
                              {i} {i === 1 ? 'Member' : 'Members'}
                            </SelectItem>
                          )
                        }
                        return options
                      })()}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Member Email Fields */}
                {memberInputs.length > 0 && (
                  <div className="col-span-4 mt-4 pt-4 border-t border-slate-700">
                    <h4 className="font-semibold mb-3 text-white">Team Members</h4>
                    <div className="space-y-3">
                      {memberInputs.map((member, index) => (
                        <div key={member.id} className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right text-sm">
                            Member {index + 1}
                          </Label>
                          <Input
                            type="email"
                            value={member.email}
                            onChange={(e) => updateMemberEmail(index, e.target.value)}
                            className="col-span-3"
                            placeholder="Enter email"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Hackathon Details */}
                <div className="col-span-4 mt-4 pt-4 border-t border-slate-700">
                  <h4 className="font-semibold mb-2 text-white">Hackathon Details</h4>
                  <div className="text-sm text-slate-400 space-y-1">
                    {hackathon.registration_start_date && (
                      <p>Registration Opens: {new Date(hackathon.registration_start_date).toLocaleDateString()}</p>
                    )}
                    {hackathon.registration_deadline && (
                      <p>Registration Closes: {new Date(hackathon.registration_deadline).toLocaleDateString()}</p>
                    )}
                    {hackathon.start_date && (
                      <p>Hackathon Starts: {new Date(hackathon.start_date).toLocaleDateString()}</p>
                    )}
                    {hackathon.submission_deadline && (
                      <p>Submission Deadline: {new Date(hackathon.submission_deadline).toLocaleDateString()}</p>
                    )}
                    <p>Team Size Range: {hackathon.min_team_size} - {hackathon.max_team_size} members</p>
                  </div>
                </div>
              </div>
              
              {state.error && (
                <p className="text-sm text-red-500 mb-4">{state.error}</p>
              )}
              
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Joining..." : "Create Team & Join"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
