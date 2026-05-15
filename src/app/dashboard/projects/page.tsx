import Link from "next/link"
import { FileText, Calendar, Users, Trophy, ArrowRight } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { ProjectsRepository } from "@/data/repositories/projects-repository"

export default async function ProjectsPage() {
  const projectsRepo = new ProjectsRepository()
  const projects = await projectsRepo.findAllWithDetails()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Projects</h1>
        <p className="text-muted-foreground mt-2">
          View your submitted projects
        </p>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No projects submitted yet"
          description="Submit a project from a hackathon page after joining with a team."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="h-full hover:border-blue-500 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold line-clamp-1">{project.name}</CardTitle>
                {project.tagline && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{project.tagline}</p>
                )}
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
              </CardContent>
              <CardFooter className="pt-2 flex flex-col items-start gap-2 border-t">
                {project.hackathons && (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground line-clamp-1">{project.hackathons.name}</span>
                  </div>
                )}
                {project.teams && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground line-clamp-1">{project.teams.name}</span>
                  </div>
                )}
                {project.average_score !== null && (
                  <Badge variant="default">
                    Score: {project.average_score.toFixed(1)}
                  </Badge>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
                <Button variant="secondary" size="sm" className="w-full mt-2" asChild>
                  <Link href={`/dashboard/projects/${project.id}?returnTo=/dashboard/projects&returnLabel=Back%20to%20Projects`}>
                    View Project
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
