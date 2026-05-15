import { LucideIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="mb-4 rounded-full bg-muted p-6">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="mb-6 max-w-sm text-muted-foreground">{description}</p>
      {action && (
        action.href ? (
          <Button asChild>
            <Link href={action.href}>
              {action.label}
            </Link>
          </Button>
        ) : (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )
      )}
    </div>
  )
}
