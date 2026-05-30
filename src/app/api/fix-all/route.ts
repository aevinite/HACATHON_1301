
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { TeamsRepository } from "@/data/repositories/teams-repository";

export async function GET() {
  const results: Record<string, any> = {};

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "No authenticated user found. Please log in first." }, { status: 401 });
    }

    results.authUser = { id: user.id, email: user.email };

    // Step 1: Check profile exists, create if missing
    let { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      const { data: newProfile, error } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          full_name: user.email?.split('@')[0] || "User",
          role: "team",
          is_active: true,
        })
        .select("*")
        .single();
      profile = newProfile;
      results.profileCreated = true;
    }
    results.profile = profile;

    // Step 2: Find user's teams
    const teamsRepo = new TeamsRepository();
    let teams = await teamsRepo.findByUserId(user.id);
    results.teamsBefore = teams;

    let teamToUse = null;
    if (teams.length === 0) {
      // Create a test team!
      teamToUse = await teamsRepo.createWithMember(
        {
          name: "Test Team " + new Date().toLocaleString(),
          hackathon_id: "6427ee87-eff9-4cc3-8422-5373d9743ddc", // Use your existing hackathon ID!
          leader_id: user.id,
          is_active: true,
        },
        user.id
      );
      results.newTeamCreated = true;
    } else {
      teamToUse = teams[0];
    }
    results.team = teamToUse;

    // Step 3: Verify team members
    const { data: teamMembers } = await supabase
      .from("team_members")
      .select("*, profiles(*)")
      .eq("team_id", teamToUse.id);
    results.teamMembers = teamMembers;

    return NextResponse.json({
      message: "All fixed! Now go to /dashboard/teams/" + teamToUse.id,
      ...results
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

