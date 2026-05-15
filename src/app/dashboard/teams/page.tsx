
import Link from "next/link"
import { Users, ArrowRight, Calendar } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TeamsRepository } from "@/data/repositories/teams-repository"
import { HackathonsRepository } from "@/data/repositories/hackathons-repository"
import { createClient } from "@/lib/supabase-server"

export default async function TeamsPage() {
  const teamsRepo = new TeamsRepository()
  const hackathonsRepo = new HackathonsRepository()
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-muted-foreground">Please log in to view your teams.</p>
      </div>
    )
  }

  const userTeams = await teamsRepo.findByUserId(user.id)
  const teamsWithHackathons = (await Promise.all(
    userTeams.map(async (team) => {
      const hackathon = await hackathonsRepo.findById(team.hackathon_id)
      if (!hackathon) return null
      return {
        ...team,
        hackathon,
      }
    })
  )).filter((team): team is NonNullable<typeof team> => team !== null)

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Your Teams</h1>
        <p className="text-muted-foreground">View and manage your hackathon teams.</p>
      </div>

      {teamsWithHackathons.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Join a hackathon to create a team."
          action={{
            label: "Browse Hackathons",
            href: "/dashboard/hackathons"
          }}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {teamsWithHackathons.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">{team.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{team.hackathon.name}</p>
                  </div>
                  <Badge variant="secondary">
                    {team.hackathon.status.charAt(0).toUpperCase() + team.hackathon.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(team.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className="flex gap-3">
                  <Link href={`/dashboard/teams/${team.id}?returnTo=/dashboard/teams&returnLabel=Back%20to%20Teams`}>
                    <Button variant="secondary" size="sm">
                      View Team
                    </Button>
                  </Link>
                  <Link href={`/dashboard/hackathons/${team.hackathon.id}?returnTo=/dashboard/teams&returnLabel=Back%20to%20Teams`}>
                    <Button variant="ghost" size="sm">
                      View Hackathon
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
