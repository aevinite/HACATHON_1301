
import { notFound, redirect } from "next/navigation"
import { HackathonsRepository } from "@/data/repositories/hackathons-repository"
import { RubricCriteriaRepository } from "@/data/repositories/rubric-criteria-repository"
import { JudgesRepository } from "@/data/repositories/judges-repository"
import { ProfilesRepository } from "@/data/repositories/profiles-repository"
import { getCurrentProfile } from "@/features/auth/server/session"
import EditHackathonForm from "./edit-hackathon-form"

type EditHackathonPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function EditHackathonPage({ params, searchParams }: EditHackathonPageProps) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const profile = await getCurrentProfile()
  const role = profile?.role || "team"

  if (role !== "admin") {
    redirect("/dashboard")
  }

  const hackathonsRepo = new HackathonsRepository()
  const rubricRepo = new RubricCriteriaRepository()
  const judgesRepo = new JudgesRepository()
  const profilesRepo = new ProfilesRepository()
  
  const [hackathon, rubricCriteria, hackathonJudges, allJudges] = await Promise.all([
    hackathonsRepo.findById(id),
    rubricRepo.findByHackathonId(id),
    judgesRepo.findByHackathonId(id),
    profilesRepo.findAllJudges(),
  ])

  if (!hackathon) {
    notFound()
  }

  const getSafeReturnTo = (returnTo: string | string[] | undefined): string => {
    if (typeof returnTo !== "string") return "/dashboard/admin/hackathons"
    if (returnTo.startsWith("/dashboard")) return returnTo
    return "/dashboard/admin/hackathons"
  }

  const getSafeReturnLabel = (returnLabel: string | string[] | undefined): string => {
    if (typeof returnLabel !== "string") return "Back to Manage Hackathons"
    return returnLabel
  }

  const returnTo = getSafeReturnTo(resolvedSearchParams.returnTo)
  const returnLabel = getSafeReturnLabel(resolvedSearchParams.returnLabel)

  const isNewHackathon = resolvedSearchParams.created === "1"

  return (
    <div>
      {isNewHackathon && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4">
          Hackathon created. You can now assign judges and finish setup.
        </div>
      )}
      <EditHackathonForm 
        hackathon={hackathon} 
        rubricCriteria={rubricCriteria} 
        hackathonJudges={hackathonJudges}
        allJudges={allJudges}
        returnTo={returnTo} 
        returnLabel={returnLabel} 
      />
    </div>
  )
}
