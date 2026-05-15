
import { BaseRepository } from "./base-repository"
import type { Database } from "@/types/supabase"

type Score = Database["public"]["Tables"]["scores"]["Row"]
type ScoreInsert = Database["public"]["Tables"]["scores"]["Insert"]
type ScoreUpdate = Database["public"]["Tables"]["scores"]["Update"]

export class ScoresRepository extends BaseRepository<Score> {
  constructor() {
    super("scores")
  }

  async findByProjectId(projectId: string): Promise<Score[]> {
    console.log("========== ScoresRepository.findByProjectId START ==========")
    console.log("ScoresRepository.findByProjectId: projectId:", projectId)
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from("scores")
      .select("*")
      .eq("project_id", projectId)

    console.log("ScoresRepository.findByProjectId: data:", data)
    console.log("ScoresRepository.findByProjectId: error:", error ? JSON.stringify(error, null, 2) : "none")
    console.log("========== ScoresRepository.findByProjectId END ==========")

    return (data as Score[]) || []
  }

  async findByJudgeAndProject(judgeId: string, projectId: string): Promise<Score | null> {
    console.log("========== ScoresRepository.findByJudgeAndProject START ==========")
    console.log("ScoresRepository.findByJudgeAndProject: judgeId:", judgeId)
    console.log("ScoresRepository.findByJudgeAndProject: projectId:", projectId)
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from("scores")
      .select("*")
      .eq("judge_id", judgeId)
      .eq("project_id", projectId)
      .maybeSingle()

    console.log("ScoresRepository.findByJudgeAndProject: data:", data)
    console.log("ScoresRepository.findByJudgeAndProject: error:", error ? JSON.stringify(error, null, 2) : "none")
    console.log("========== ScoresRepository.findByJudgeAndProject END ==========")

    return data
  }

  async createOrUpdateScore(payload: ScoreInsert): Promise<Score> {
    console.log("========== ScoresRepository.createOrUpdateScore START ==========")
    console.log("ScoresRepository.createOrUpdateScore: Payload:", JSON.stringify(payload, null, 2))
    console.log("ScoresRepository.createOrUpdateScore: Payload types:")
    console.log("  - project_id:", typeof payload.project_id, payload.project_id)
    console.log("  - judge_id:", typeof payload.judge_id, payload.judge_id)
    console.log("  - hackathon_id:", typeof payload.hackathon_id, payload.hackathon_id)
    console.log("  - total_score:", typeof payload.total_score, payload.total_score)
    console.log("  - comment:", typeof payload.comment, payload.comment)
    console.log("  - is_submitted:", typeof payload.is_submitted, payload.is_submitted)
    
    const supabase = await this.getClient()
    
    const existing = await this.findByJudgeAndProject(payload.judge_id, payload.project_id)
    console.log("ScoresRepository.createOrUpdateScore: existing score:", existing)
    
    if (existing) {
      console.log("ScoresRepository.createOrUpdateScore: Updating existing score with ID:", existing.id)
      const updatePayload = {
        total_score: payload.total_score,
        comment: payload.comment,
        is_submitted: payload.is_submitted,
      }
      console.log("ScoresRepository.createOrUpdateScore: updatePayload:", JSON.stringify(updatePayload, null, 2))
      
      const { data, error } = await supabase
        .from("scores")
        .update(updatePayload as any)
        .eq("id", existing.id)
        .select("*")
        .single()

      console.log("ScoresRepository.createOrUpdateScore: update result data:", data)
      console.log("ScoresRepository.createOrUpdateScore: update result error:", error ? JSON.stringify(error, null, 2) : "none")
      if (error) {
        console.error("ScoresRepository.createOrUpdateScore: FULL ERROR OBJECT:", error)
        console.error("  error.code:", error.code)
        console.error("  error.message:", error.message)
        console.error("  error.details:", error.details)
        console.error("  error.hint:", error.hint)
      }
      console.log("========== ScoresRepository.createOrUpdateScore END (UPDATE) ==========")
      
      if (error) throw error
      return data
    } else {
      console.log("ScoresRepository.createOrUpdateScore: Creating new score")
      const { data, error } = await supabase
        .from("scores")
        .insert(payload)
        .select("*")
        .single()

      console.log("ScoresRepository.createOrUpdateScore: create result data:", data)
      console.log("ScoresRepository.createOrUpdateScore: create result error:", error ? JSON.stringify(error, null, 2) : "none")
      if (error) {
        console.error("ScoresRepository.createOrUpdateScore: FULL ERROR OBJECT:", error)
        console.error("  error.code:", error.code)
        console.error("  error.message:", error.message)
        console.error("  error.details:", error.details)
        console.error("  error.hint:", error.hint)
      }
      console.log("========== ScoresRepository.createOrUpdateScore END (CREATE) ==========")
      
      if (error) throw error
      return data
    }
  }

  async getAverageScoreByProject(projectId: string): Promise<number | null> {
    const scores = await this.findByProjectId(projectId)
    if (scores.length === 0) return null
    
    const sum = scores.reduce((acc, score) => acc + score.total_score, 0)
    return sum / scores.length
  }
}
