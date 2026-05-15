
import { redirect } from "next/navigation"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"
import { JudgesRepository } from "@/data/repositories/judges-repository"
import { HackathonsRepository } from "@/data/repositories/hackathons-repository"
import { getCurrentProfile } from "@/features/auth/server/session"
import AdminJudgesClient from "./admin-judges-client"

type AdminJudgesPageProps = {
  params: Promise<{}>
}

export default async function AdminJudgesPage({ params }: AdminJudgesPageProps) {
  const profile = await getCurrentProfile()
  const role = profile?.role || "team"

  if (role !== "admin") {
    redirect("/dashboard")
  }

  const profilesRepo = new ProfilesRepository()
  const judgesRepo = new JudgesRepository()
  const hackathonsRepo = new HackathonsRepository()
  
  const judges = await profilesRepo.findAllJudges()
  const assignments = await judgesRepo.findAllWithDetails()
  const hackathons = await hackathonsRepo.findAll()

  const judgesWithAssignments = judges.map(judge => {
    const judgeAssignments = assignments.filter(a => a.user_id === judge.id)
    return {
      ...judge,
      assignments: judgeAssignments
    }
  })

  return (
    <div className="p-6 md:p-8">
      <AdminJudgesClient initialJudges={judgesWithAssignments} hackathons={hackathons} />
    </div>
  )
}

