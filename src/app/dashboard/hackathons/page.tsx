import { HackathonsRepository } from "@/data/repositories/hackathons-repository"
import HackathonsClient from "./hackathons-client"

export default async function HackathonsPage() {
  const repository = new HackathonsRepository()
  const hackathons = await repository.findPublic()

  return (
    <HackathonsClient initialHackathons={hackathons} />
  )
}
