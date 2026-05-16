
import CreateHackathonForm from "./create-hackathon-form"
import { getCurrentProfile } from "@/features/auth/server/session"
import { redirect } from "next/navigation"

export default async function NewHackathonPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }
  
  return <CreateHackathonForm />
}

