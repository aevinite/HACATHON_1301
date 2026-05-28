import Link from "next/link"
import { Button } from "@/components/ui/button"

interface AdminPageHeaderProps {
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
  eyebrow?: string
}

export function AdminPageHeader({ title, description, action, eyebrow }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        {eyebrow && (
          <p className="text-sm font-medium text-slate-400 mb-1">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {title}
        </h1>
        {description && (
          <p className="text-slate-400 mt-1.5">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0">
          <Button asChild variant="secondary" className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 text-slate-200">
            <Link href={action.href}>
              {action.label}
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
