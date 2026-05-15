
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProjectForm } from "@/features/projects/components/project-form"

type NewProjectPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ hackathon_id?: string }>
}

export default async function NewProjectPage({ params, searchParams }: NewProjectPageProps) {
  const { id: teamId } = await params
  const { hackathon_id: hackathonId } = await searchParams

  if (!hackathonId) {
    notFound()
  }

  return <ProjectForm teamId={teamId} hackathonId={hackathonId} />
}
