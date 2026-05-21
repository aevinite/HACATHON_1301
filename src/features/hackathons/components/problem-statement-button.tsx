"use client"

import { useState } from "react"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getProblemStatementSignedUrlAction } from "@/features/hackathons/server/actions"

interface ProblemStatementButtonProps {
  hackathonId: string
}

export function ProblemStatementButton({ hackathonId }: ProblemStatementButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setIsLoading(true)
    setError(null)
    
    const result = await getProblemStatementSignedUrlAction(hackathonId)
    if (result.success) {
      window.open(result.url, "_blank")
    } else {
      setError(result.error)
    }
    
    setIsLoading(false)
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border">
          {error}
        </div>
      )}
      <Button onClick={handleClick} disabled={isLoading} className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        {isLoading ? "Loading..." : "View / Download Problem Statement"}
      </Button>
    </div>
  )
}
