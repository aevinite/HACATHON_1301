
"use client"

import Link from "next/link"
import { useActionState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createProjectAction } from "@/features/projects/server/actions"

interface ProjectFormProps {
  teamId: string
  hackathonId: string
}

export function ProjectForm({ teamId, hackathonId }: ProjectFormProps) {
  const [state, formAction, isPending] = useActionState(async () => {
    await createProjectAction(new FormData())
    return {}
  }, {})

  const handleSubmit = async (formData: FormData) => {
    formData.set("team_id", teamId)
    formData.set("hackathon_id", hackathonId)
    await createProjectAction(formData)
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/teams/${teamId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Team
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Submit Your Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Project Name *
              </label>
              <Input id="name" name="name" required placeholder="My Awesome Project" />
            </div>

            <div>
              <label htmlFor="tagline" className="block text-sm font-medium mb-2">
                Tagline *
              </label>
              <Input id="tagline" name="tagline" required placeholder="A short one-liner describing your project" />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description *
              </label>
              <Textarea id="description" name="description" required rows={6} placeholder="Describe your project in detail..." />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="github_url" className="block text-sm font-medium mb-2">
                  GitHub URL (optional)
                </label>
                <Input id="github_url" name="github_url" type="url" placeholder="https://github.com/your-username/your-project" />
              </div>

              <div>
                <label htmlFor="live_url" className="block text-sm font-medium mb-2">
                  Live Demo URL (optional)
                </label>
                <Input id="live_url" name="live_url" type="url" placeholder="https://your-project.vercel.app" />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" asChild>
                <Link href={`/dashboard/teams/${teamId}`}>
                  Cancel
                </Link>
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Submitting..." : "Submit Project"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
