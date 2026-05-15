
import { Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { Database } from "@/types/supabase"

type TimelineEvent = Database["public"]["Tables"]["timeline_events"]["Row"]

interface TimelineProps {
  events: TimelineEvent[]
}

export function Timeline({ events }: TimelineProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No timeline events yet
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {events.map((event, index) => (
        <div key={event.id} className="relative flex gap-4">
          {/* Timeline Line */}
          {index < events.length - 1 && (
            <div className="absolute left-4 top-8 w-0.5 h-full bg-muted" />
          )}
          
          {/* Timeline Dot */}
          <div className="relative z-10 flex h-8 w-8 flex-none items-center justify-center rounded-full border-2 border-primary bg-background">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          
          {/* Timeline Content */}
          <div className="flex-1 pt-1">
            <Card className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-lg">{event.label}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(event.date)}
                  </p>
                  {event.description && (
                    <p className="text-sm mt-2 text-muted-foreground">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      ))}
    </div>
  )
}
