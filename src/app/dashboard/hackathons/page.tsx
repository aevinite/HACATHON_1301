import { HackathonsRepository } from "@/data/repositories/hackathons-repository"
import { TeamsRepository } from "@/data/repositories/teams-repository"
import { getCurrentProfile } from "@/features/auth/server/session"
import HackathonsClient from "./hackathons-client"

export default async function HackathonsPage() {
  const repository = new HackathonsRepository()
  const teamsRepository = new TeamsRepository()
  const profile = await getCurrentProfile()
  const hackathons = await repository.findPublic()

  const hackathonsWithUserData = await Promise.all(
    hackathons.map(async (hackathon) => {
      let userTeam = null
      if (profile) {
        userTeam = await teamsRepository.findByHackathonAndUserId(hackathon.id, profile.id)
      }
      return {
        ...hackathon,
        userTeam,
        isParticipating: !!userTeam,
      }
    })
  )

  return (
    <HackathonsClient initialHackathons={hackathonsWithUserData} showCreateButton={false} />
  )
}
