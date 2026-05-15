
"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Trophy, Users, ArrowLeft, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { submitScoreAction } from "@/features/scoring/server/actions"

interface Project {
  id: string
  name: string
  tagline: string
  description: string
  hackathons?: { name: string } | null
  teams?: { name: string } | null
}

interface ReviewPageClientProps {
  project: Project
  existingScore?: { total_score: number; comment: string | null } | null
  rubricCriteria: any[]
  returnTo: string
  returnLabel: string
}

export default function ReviewPageClient({ project, existingScore, rubricCriteria, returnTo, returnLabel }: ReviewPageClientProps) {
  const params = useParams()
  const router = useRouter()
  const [score, setScore] = useState<number>(existingScore?.total_score ?? 50)
  const [comment, setComment] = useState<string>(existingScore?.comment ?? "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getScoreLabel = (s: number): string => {
    if (s <= 33) return "Poor"
    if (s <= 66) return "Average"
    return "Excellent"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      console.log("ReviewPageClient - Submitting score:", score)
      const result = await submitScoreAction(params.id as string, score, comment || null, returnTo)

      if (result.success) {
        if (result.redirectTo) {
          router.push(result.redirectTo)
        }
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error("Unexpected error submitting score:", error)
      alert("An unexpected error occurred. Please check console for details.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={returnTo}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {returnLabel}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Score Project</CardTitle>
            {existingScore && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                You already reviewed this project
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">{project.name}</h3>
            {project.tagline && (
              <p className="text-muted-foreground">{project.tagline}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-2">
              {project.teams && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{project.teams.name}</span>
                </div>
              )}
              {project.hackathons && (
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{project.hackathons.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold">Judging Criteria / Rubric</h4>
            <p className="text-xs text-muted-foreground mb-2">These are the criteria to consider while scoring projects.</p>
            {rubricCriteria.length > 0 ? (
              <div className="space-y-2">
                {rubricCriteria.map((criterion) => (
                  <div key={criterion.id} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{criterion.name}</span>
                      {criterion.description && (
                        <p className="text-xs text-muted-foreground">{criterion.description}</p>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">Max: {criterion.max_score}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No judging criteria added yet.</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="score">Total Score</Label>
              
              <div className="text-center">
                <div className="text-6xl font-bold mb-2">{score}</div>
                <div className="text-xl text-muted-foreground">{getScoreLabel(score)}</div>
              </div>

              <input
                id="score"
                type="range"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                required
              />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 (Poor)</span>
                <span>50 (Average)</span>
                <span>100 (Excellent)</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Feedback (optional)</Label>
              <Textarea
                id="comment"
                placeholder="Share your feedback about this project..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : (existingScore ? "Update Score" : "Submit Score")}
              </Button>
              <Link href={returnTo}>
                <Button variant="secondary">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
