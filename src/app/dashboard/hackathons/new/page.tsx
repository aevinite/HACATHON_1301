
import CreateHackathonForm from "./create-hackathon-form"
import { getCurrentProfile } from "@/features/auth/server/session"
import { redirect } from "next/navigation"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"

export default async function NewHackathonPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }
  
  const profilesRepo = new ProfilesRepository()
  const allJudges = await profilesRepo.findAllJudges()
  
  return <CreateHackathonForm allJudges={allJudges} />
}

