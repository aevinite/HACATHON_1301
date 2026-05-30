
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const results: Record<string, any> = {};
  const leaderId = "a5495815-1162-4c48-8be3-cbd2ef3fcf22";
  const teamId = "77dd283d-c2c0-4e28-a57c-1534c7c2a442";

  try {
    const supabase = await createClient();

    // Step 1: Fix Profile
    let { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", leaderId)
      .maybeSingle();

    if (!profile) {
      const { data: newProfile, error } = await supabase
        .from("profiles")
        .insert({
          id: leaderId,
          full_name: "DOREMON", // Your leader's name!
          role: "team",
          is_active: true,
        })
        .select("*")
        .single();
      profile = newProfile;
      results.profileCreated = true;
    }
    results.profile = profile;

    // Step 2: Fix Team Members
    let { data: members } = await supabase
      .from("team_members")
      .select("*, profiles(*)")
      .eq("team_id", teamId);

    if (!members || members.length === 0) {
      const { data: insertedMember } = await supabase
        .from("team_members")
        .insert({
          team_id: teamId,
          user_id: leaderId,
        })
        .select();
      results.memberInserted = insertedMember;
    }

    // Step 3: Verify
    const { data: finalMembers } = await supabase
      .from("team_members")
      .select("*, profiles(*)")
      .eq("team_id", teamId);
    results.finalMembers = finalMembers;

    return NextResponse.json({
      message: "All fixed! Now go to http://localhost:3000/dashboard/teams/" + teamId,
      ...results
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

