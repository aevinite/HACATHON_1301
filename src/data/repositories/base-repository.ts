import { createClient } from "@/lib/supabase-server"
import type { Database } from "@/types/supabase"

export abstract class BaseRepository<T extends { id: string }> {
  protected readonly tableName: keyof Database["public"]["Tables"]

  constructor(tableName: keyof Database["public"]["Tables"]) {
    this.tableName = tableName
  }

  protected async getClient() {
    return await createClient()
  }

  async findById(id: string): Promise<T | null> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .single()

    return data as T | null
  }

  async findAll(): Promise<T[]> {
    const supabase = await this.getClient()
    const { data } = await supabase.from(this.tableName).select("*")
    return (data as T[]) || []
  }

  async create(entity: Omit<T, "id" | "created_at" | "updated_at">): Promise<T> {
    console.log("========== BaseRepository.create START ==========")
    console.log("BaseRepository.create: Table:", this.tableName)
    console.log("BaseRepository.create: Entity:", entity)
    
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(entity as any)
      .select("*")
      .single()

    console.log("BaseRepository.create: Supabase response:", { data, error })
    
    if (error) {
      console.log("BaseRepository.create: ERROR:", error)
      console.log("BaseRepository.create: Error details:", JSON.stringify(error, null, 2))
      console.log("========== BaseRepository.create END (ERROR) ==========")
      throw error
    }
    
    console.log("BaseRepository.create: Success! Data:", data)
    console.log("========== BaseRepository.create END (SUCCESS) ==========")
    return data as T
  }

  async update(
    id: string,
    updates: Partial<Omit<T, "id" | "created_at">>
  ): Promise<T | null> {
    console.log("========== BaseRepository.update START ==========")
    console.log("BaseRepository.update: Table:", this.tableName)
    console.log("BaseRepository.update: ID:", id)
    console.log("BaseRepository.update: Updates:", JSON.stringify(updates, null, 2))
    
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from(this.tableName)
      .update(updates as any)
      .eq("id", id)
      .select("*")
      .single()

    console.log("BaseRepository.update: Supabase response:", { data, error })
    if (error) {
      console.log("BaseRepository.update: ERROR:", error)
      console.log("BaseRepository.update: Error details:", JSON.stringify(error, null, 2))
      console.log("========== BaseRepository.update END (ERROR) ==========")
      throw error
    }
    
    console.log("BaseRepository.update: Success! Data:", data)
    console.log("========== BaseRepository.update END (SUCCESS) ==========")
    return data as T | null
  }

  async delete(id: string): Promise<boolean> {
    const supabase = await this.getClient()
    const { error } = await supabase.from(this.tableName).delete().eq("id", id)
    return !error
  }
}
