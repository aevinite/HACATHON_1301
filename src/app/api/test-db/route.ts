
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const results: Record<string, any> = {};

  const supabase = await createClient();

  // 1. Get ALL profiles
  try {
    const { data: profiles } = await supabase.from("profiles").select("*");
    results.profiles = profiles;
  } catch (e: any) {
    results.profilesError = e.message;
  }

  // 2. Get ALL teams with their leader
  try {
    const { data: teams } = await supabase.from("teams").select("*");
    results.teams = teams;
  } catch (e: any) {
    results.teamsError = e.message;
  }

  // 3. Get ALL team_members
  try {
    const { data: team_members } = await supabase.from("team_members").select("*, profiles(*)");
    results.team_members = team_members;
  } catch (e: any) {
    results.team_membersError = e.message;
  }

  return NextResponse.json(results);
}
