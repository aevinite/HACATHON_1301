
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const leaderId = "a5495815-1162-4c48-8be3-cbd2ef3fcf22";
  
  const supabase = await createClient();
  
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", leaderId)
    .maybeSingle();
  
  if (existingProfile) {
    return NextResponse.json({ message: "Profile already exists", profile: existingProfile });
  }
  
  // Create the profile
  const { data: newProfile, error } = await supabase
    .from("profiles")
    .insert({
      id: leaderId,
      full_name: "Team Leader", // Or whatever name you want!
      role: "team", // Default role
      is_active: true,
    })
    .select("*")
    .single();
  
  return NextResponse.json({ 
    message: "Profile created successfully!", 
    profile: newProfile, 
    error 
  });
}

