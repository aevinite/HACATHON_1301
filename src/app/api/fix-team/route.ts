
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const results: Record<string, any> = {};
  const teamIdToFix = "77dd283d-c2c0-4e28-a57c-1534c7c2a442"; // Your team ID!
  const leaderId = "a5495815-1162-4c48-8be3-cbd2ef3fcf22"; // Your leader ID!

  const supabase = await createClient();

  // First check existing team members
  const { data: existingMembers, error: fetchError } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamIdToFix);

  results.existingMembersBefore = existingMembers;
  results.fetchError = fetchError;

  // If no members, add the leader!
  if (!existingMembers || existingMembers.length === 0) {
    const { data: insertedMember, error: insertError } = await supabase
      .from("team_members")
      .insert({
        team_id: teamIdToFix,
        user_id: leaderId,
      })
      .select();
    results.insertedMember = insertedMember;
    results.insertError = insertError;
  }

  // Check after
  const { data: existingMembersAfter } = await supabase
    .from("team_members")
    .select("*, profiles(*)")
    .eq("team_id", teamIdToFix);

  results.existingMembersAfter = existingMembersAfter;

  return NextResponse.json(results);
}

