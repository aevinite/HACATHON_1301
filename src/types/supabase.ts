export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          role: "admin" | "team" | "judge" | "organizer"
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          role?: "admin" | "team" | "judge" | "organizer"
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: "admin" | "team" | "judge" | "organizer"
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      hackathons: {
        Row: {
          id: string
          name: string
          description: string
          theme: string | null
          banner_image: string | null
          status: "draft" | "registration" | "submission" | "judging" | "completed"
          is_public: boolean
          registration_start_date: string | null
          registration_deadline: string | null
          start_date: string | null
          submission_deadline: string | null
          judging_deadline: string | null
          min_team_size: number
          max_team_size: number
          problem_statement: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          theme?: string | null
          banner_image?: string | null
          status?: "draft" | "registration" | "submission" | "judging" | "completed"
          is_public?: boolean
          registration_start_date?: string | null
          registration_deadline?: string | null
          start_date?: string | null
          submission_deadline?: string | null
          judging_deadline?: string | null
          min_team_size?: number
          max_team_size?: number
          problem_statement?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          theme?: string | null
          banner_image?: string | null
          status?: "draft" | "registration" | "submission" | "judging" | "completed"
          is_public?: boolean
          registration_start_date?: string | null
          registration_deadline?: string | null
          start_date?: string | null
          submission_deadline?: string | null
          judging_deadline?: string | null
          min_team_size?: number
          max_team_size?: number
          problem_statement?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          hackathon_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          hackathon_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          hackathon_id?: string
          name?: string
          created_at?: string
        }
      }
      rubric_criteria: {
        Row: {
          id: string
          hackathon_id: string
          name: string
          description: string | null
          max_score: number
          weight: number
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          hackathon_id: string
          name: string
          description?: string | null
          max_score: number
          weight?: number
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          hackathon_id?: string
          name?: string
          description?: string | null
          max_score?: number
          weight?: number
          sort_order?: number
          created_at?: string
        }
      }
      timeline_events: {
        Row: {
          id: string
          hackathon_id: string
          label: string
          date: string
          description: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          hackathon_id: string
          label: string
          date: string
          description?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          hackathon_id?: string
          label?: string
          date?: string
          description?: string | null
          sort_order?: number
          created_at?: string
        }
      }
      problem_statements: {
        Row: {
          id: string
          hackathon_id: string
          title: string
          url: string
          uploaded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          hackathon_id: string
          title: string
          url: string
          uploaded_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          hackathon_id?: string
          title?: string
          url?: string
          uploaded_at?: string
          created_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          hackathon_id: string
          leader_id: string
          invite_code: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          hackathon_id: string
          leader_id: string
          invite_code?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          hackathon_id?: string
          leader_id?: string
          invite_code?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: string | null
          joined_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          tagline: string
          description: string
          hackathon_id: string
          team_id: string
          submitted_by: string
          category_id: string | null
          cover_image: string | null
          video_url: string | null
          github_url: string | null
          live_url: string | null
          status: "draft" | "submitted" | "disqualified"
          is_visible: boolean
          average_score: number | null
          total_judged: number
          rank: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          tagline: string
          description: string
          hackathon_id: string
          team_id: string
          submitted_by: string
          category_id?: string | null
          cover_image?: string | null
          video_url?: string | null
          github_url?: string | null
          live_url?: string | null
          status?: "draft" | "submitted" | "disqualified"
          is_visible?: boolean
          average_score?: number | null
          total_judged?: number
          rank?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          tagline?: string
          description?: string
          hackathon_id?: string
          team_id?: string
          submitted_by?: string
          category_id?: string | null
          cover_image?: string | null
          video_url?: string | null
          github_url?: string | null
          live_url?: string | null
          status?: "draft" | "submitted" | "disqualified"
          is_visible?: boolean
          average_score?: number | null
          total_judged?: number
          rank?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      project_tech_stack: {
        Row: {
          id: string
          project_id: string
          technology: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          technology: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          technology?: string
          created_at?: string
        }
      }
      judges: {
        Row: {
          id: string
          user_id: string
          hackathon_id: string
          judge_id: string
          name: string
          email: string
          status: "active" | "pending"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          hackathon_id: string
          judge_id: string
          name: string
          email: string
          status?: "active" | "pending"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          hackathon_id?: string
          judge_id?: string
          name?: string
          email?: string
          status?: "active" | "pending"
          created_at?: string
          updated_at?: string
        }
      }
      scores: {
        Row: {
          id: string
          project_id: string
          judge_id: string
          hackathon_id: string
          total_score: number
          comment: string | null
          is_submitted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          judge_id: string
          hackathon_id: string
          total_score: number
          comment?: string | null
          is_submitted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          judge_id?: string
          hackathon_id?: string
          total_score?: number
          comment?: string | null
          is_submitted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      score_criteria: {
        Row: {
          id: string
          score_id: string
          criterion_id: string
          criterion_name: string
          score: number
          max_score: number
          created_at: string
        }
        Insert: {
          id?: string
          score_id: string
          criterion_id: string
          criterion_name: string
          score: number
          max_score: number
          created_at?: string
        }
        Update: {
          id?: string
          score_id?: string
          criterion_id?: string
          criterion_name?: string
          score?: number
          max_score?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
