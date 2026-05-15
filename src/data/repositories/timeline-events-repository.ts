
import { BaseRepository } from "./base-repository"
import type { Database } from "@/types/supabase"

type TimelineEvent = Database["public"]["Tables"]["timeline_events"]["Row"]
type TimelineEventInsert = Database["public"]["Tables"]["timeline_events"]["Insert"]
type TimelineEventUpdate = Database["public"]["Tables"]["timeline_events"]["Update"]

export class TimelineEventsRepository extends BaseRepository<TimelineEvent> {
  constructor() {
    super("timeline_events")
  }

  async findByHackathonId(hackathonId: string): Promise<TimelineEvent[]> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("timeline_events")
      .select("*")
      .eq("hackathon_id", hackathonId)
      .order("sort_order", { ascending: true })
      .order("date", { ascending: true })
    return (data as TimelineEvent[]) || []
  }
}
