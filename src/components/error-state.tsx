import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  title?: string
  description?: string
  retry?: () => void
  className?: string
}

export function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  retry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="mb-4 rounded-full bg-destructive/10 p-6">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-destructive">{title}</h3>
      <p className="mb-6 max-w-sm text-muted-foreground">{description}</p>
      {retry && (
        <Button onClick={retry} variant="destructive">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  )
}
