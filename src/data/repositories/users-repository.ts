import { BaseRepository } from "./base-repository"
import type { Database } from "@/types/supabase"

type User = Database["public"]["Tables"]["users"]["Row"]
type UserInsert = Database["public"]["Tables"]["users"]["Insert"]
type UserUpdate = Database["public"]["Tables"]["users"]["Update"]

export class UsersRepository extends BaseRepository<User> {
  constructor() {
    super("users")
  }

  async findByUserId(userId: string): Promise<User | null> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    return data
  }

  async findByEmail(email: string): Promise<User | null> {
    const supabase = await this.getClient()
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle()

    return data
  }
}

