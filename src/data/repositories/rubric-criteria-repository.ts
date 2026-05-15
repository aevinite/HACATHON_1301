
import { BaseRepository } from "./base-repository"
import type { Database } from "@/types/supabase"

type RubricCriterion = Database["public"]["Tables"]["rubric_criteria"]["Row"]
type RubricCriterionInsert = Database["public"]["Tables"]["rubric_criteria"]["Insert"]
type RubricCriterionUpdate = Database["public"]["Tables"]["rubric_criteria"]["Update"]

export class RubricCriteriaRepository extends BaseRepository<RubricCriterion> {
  constructor() {
    super("rubric_criteria")
  }

  async findByHackathonId(hackathonId: string): Promise<RubricCriterion[]> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("rubric_criteria")
      .select("*")
      .eq("hackathon_id", hackathonId)
      .order("sort_order", { ascending: true })

    return (data as RubricCriterion[]) || []
  }
}
