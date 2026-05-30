
"use client"

import { useActionState, useEffect, useState, useCallback } from "react"
import { Users, Check, ChevronsUpDown } from "lucide-react"
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type Hackathon = Database["public"]["Tables"]["hackathons"]["Row"]
type Team = Database["public"]["Tables"]["teams"]["Row"]
type Profile = Database["public"]["Tables"]["profiles"]["Row"] & { email?: string | null }

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
  userId: string | null
  selectedProfile: Profile | null
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

  // Initialize member inputs when member count changes
  useEffect(() => {
    const count = parseInt(memberCount)
    const newInputs: MemberInput[] = []
    for (let i = 0; i < count - 1; i++) { // minus 1 because current user is already a member
      newInputs.push({ id: i, userId: null, selectedProfile: null })
    }
    setMemberInputs(newInputs)
  }, [memberCount])

  useEffect(() => {
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

  const handleJoinClick = () => {
    // Set default team name
    setTeamName("My Team")
    // Set default member count to min team size or 1
    const defaultCount = hackathon.min_team_size || 1
    setMemberCount(defaultCount.toString())
    setIsOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsOpen(false)
    // Create a FormData object and trigger the action
    const formData = new FormData()
    formData.set("hackathon_id", hackathonId)
    formData.set("team_name", teamName)
    formData.set("member_count", memberCount)
    
    // Add member user IDs
    memberInputs.forEach((member, index) => {
      if (member.userId) {
        formData.set(`member_id_${index}`, member.userId)
      }
    })
    
    // @ts-ignore - useActionState expects a FormData input for the function
    formAction(formData)
  }

  const updateMember = (index: number, profile: Profile | null) => {
    const newInputs = [...memberInputs]
    newInputs[index] = {
      ...newInputs[index],
      userId: profile ? profile.id : null,
      selectedProfile: profile
    }
    setMemberInputs(newInputs)
  }

  const isUserIdSelected = (userId: string, currentIndex: number) => {
    return memberInputs.some((input, idx) => idx !== currentIndex && input.userId === userId)
  }

  const MemberCombobox = ({ index }: { index: number }) => {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(false)

    const searchProfiles = useCallback(async (q: string) => {
      if (!q || q.length < 1) {
        setProfiles([])
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`/api/profiles/search?q=${encodeURIComponent(q)}`)
        if (res.ok) {
          const data = await res.json()
          // Filter out already selected users and current user
          const filtered = data.filter((p: Profile) => !isUserIdSelected(p.id, index))
          setProfiles(filtered)
        }
      } catch (err) {
        console.error("Error searching profiles:", err)
      } finally {
        setLoading(false)
      }
    }, [index])

    useEffect(() => {
      const timeoutId = setTimeout(() => searchProfiles(searchQuery), 300)
      return () => clearTimeout(timeoutId)
    }, [searchQuery, searchProfiles])

    return (
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right text-sm">
          Member {index + 1}
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild className="col-span-3">
            <Button
              variant="secondary"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {memberInputs[index].selectedProfile 
                ? memberInputs[index].selectedProfile.full_name || "Unknown"
                : "Select a team member..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder="Search by email..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>
                  {loading ? "Searching..." : "No user found"}
                </CommandEmpty>
                <CommandGroup>
                  {profiles.map((profile) => (
                    <CommandItem
                      key={profile.id}
                      value={profile.id}
                      onSelect={() => {
                        updateMember(index, profile)
                        setOpen(false)
                        setSearchQuery("")
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          memberInputs[index].userId === profile.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{profile.full_name || "Unknown"}</span>
                        <span className="text-xs text-slate-400">{profile.email || "No email"}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  if (isParticipating) {
    return (
      <div className="flex-1 w-full">
        {team ? (
          <Button asChild variant="secondary" size="default" className="w-full">
            <Link href={`/dashboard/teams/${team.id}?returnTo=/dashboard/hackathons/${hackathonId}&returnLabel=Back to Hackathon`} className="w-full">
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
              Create your team to join the hackathon. You can invite more members later.
            </DialogDescription>
          </DialogHeader>
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
              
              {/* Member Select Dropdowns */}
              {memberInputs.length > 0 && (
                <div className="col-span-4 mt-4 pt-4 border-t border-slate-700 space-y-4">
                  <h4 className="font-semibold mb-3 text-white">Team Members</h4>
                  {memberInputs.map((_, index) => (
                    <MemberCombobox key={index} index={index} />
                  ))}
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
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Joining..." : "Create Team & Join"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

