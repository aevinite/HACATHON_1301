
import type { Database } from "@/types/supabase"

type Hackathon = Database["public"]["Tables"]["hackathons"]["Row"]

export type HackathonLifecycleStatus = 
  | "registration_open" 
  | "registration_closed" 
  | "not_started" 
  | "running" 
  | "judging" 
  | "completed"

export type HackathonGroupBucket = 
  | "current_active" 
  | "upcoming_not_started" 
  | "finished_completed"

export function isHackathonRegistrationOpen(hackathon: Hackathon): boolean {
  const now = new Date()
  
  const registrationStartDate = hackathon.registration_start_date ? new Date(hackathon.registration_start_date) : null
  const registrationDeadline = hackathon.registration_deadline ? new Date(hackathon.registration_deadline) : null
  const startDate = hackathon.start_date ? new Date(hackathon.start_date) : null

  if (startDate && now >= startDate) {
    return false
  }

  if (!registrationStartDate) {
    return false
  }
  
  // Handle timezone issues by comparing date-only parts as well
  const regStartDateOnly = new Date(registrationStartDate.getFullYear(), registrationStartDate.getMonth(), registrationStartDate.getDate());
  const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (!(todayDateOnly >= regStartDateOnly || now >= registrationStartDate)) {
    return false
  }

  if (registrationDeadline && now >= registrationDeadline) {
    return false
  }

  return true
}

export function isHackathonNotStarted(hackathon: Hackathon): boolean {
  const now = new Date()
  const registrationStartDate = hackathon.registration_start_date ? new Date(hackathon.registration_start_date) : null
  
  return registrationStartDate !== null && now < registrationStartDate
}

export function isProjectSubmissionAllowed(hackathon: Hackathon): boolean {
  const now = new Date()
  const startDate = hackathon.start_date ? new Date(hackathon.start_date) : null
  const submissionDeadline = hackathon.submission_deadline ? new Date(hackathon.submission_deadline) : null
  
  if (!startDate || now < startDate) {
    return false
  }
  
  if (!submissionDeadline || now > submissionDeadline) {
    return false
  }
  
  return true
}

export function getSubmissionStatusText(hackathon: Hackathon): string {
  const now = new Date()
  const startDate = hackathon.start_date ? new Date(hackathon.start_date) : null
  const submissionDeadline = hackathon.submission_deadline ? new Date(hackathon.submission_deadline) : null
  
  if (!startDate || now < startDate) {
    return "Hackathon has not started yet."
  }
  
  if (!submissionDeadline || now > submissionDeadline) {
    return "Submission is closed."
  }
  
  return ""
}

export function getHackathonLifecycleStatus(hackathon: Hackathon): HackathonLifecycleStatus {
  const now = new Date()
  
  const registrationStartDate = hackathon.registration_start_date ? new Date(hackathon.registration_start_date) : null
  const registrationDeadline = hackathon.registration_deadline ? new Date(hackathon.registration_deadline) : null
  const startDate = hackathon.start_date ? new Date(hackathon.start_date) : null
  const submissionDeadline = hackathon.submission_deadline ? new Date(hackathon.submission_deadline) : null
  const judgingDeadline = hackathon.judging_deadline ? new Date(hackathon.judging_deadline) : null

  // Determine final relevant deadline
  const finalDeadline = 
    (judgingDeadline) || 
    (submissionDeadline) || 
    null

  if (hackathon.results_published || hackathon.results_visible_to_participants) {
    return "completed"
  }

  if (finalDeadline && now > finalDeadline) {
    return "completed"
  }

  if (startDate && now >= startDate) {
    if (submissionDeadline && now <= submissionDeadline) {
      return "running"
    } else {
      return "judging"
    }
  }

  // First, check if registration start date is set
  if (registrationStartDate) {
    // Get just the date part to compare to handle timezone issues
    const regStartDateOnly = new Date(registrationStartDate.getFullYear(), registrationStartDate.getMonth(), registrationStartDate.getDate());
    const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // If registration start date is today or earlier
    if (todayDateOnly >= regStartDateOnly || now >= registrationStartDate) {
      // Check if registration is still open
      if (registrationDeadline && now < registrationDeadline) {
        return "registration_open"
      } else {
        // Registration has closed but hackathon not started yet
        return "registration_closed"
      }
    }
  }

  return "not_started"
}

export function getHackathonGroupBucket(hackathon: Hackathon): HackathonGroupBucket {
  const lifecycle = getHackathonLifecycleStatus(hackathon)
  const now = new Date()
  const registrationStartDate = hackathon.registration_start_date ? new Date(hackathon.registration_start_date) : null

  if (lifecycle === "completed") {
    return "finished_completed"
  }

  if (lifecycle === "registration_open" || 
      lifecycle === "registration_closed" || 
      lifecycle === "running" || 
      lifecycle === "judging") {
    return "current_active"
  }

  return "upcoming_not_started"
}

export function getHackathonStatusLabel(status: HackathonLifecycleStatus | string): string {
  switch (status) {
    case "registration_open":
      return "Registration Open"
    case "registration_closed":
      return "Starting Soon"
    case "not_started":
      return "Not Started"
    case "running":
      return "Running"
    case "judging":
      return "Judging"
    case "completed":
      return "Completed"
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

export function getHackathonGroupLabel(bucket: HackathonGroupBucket): string {
  switch (bucket) {
    case "current_active":
      return "Current / Active"
    case "upcoming_not_started":
      return "Upcoming / Not Started"
    case "finished_completed":
      return "Finished / Completed"
  }
}

export function getHackathonStatusBadgeClass(status: HackathonLifecycleStatus | string): string {
  switch (status) {
    case "registration_open":
      return "bg-green-500/20 text-green-300 border-green-500/30 font-semibold text-sm px-3 py-1"
    case "registration_closed":
      return "bg-amber-500/20 text-amber-300 border-amber-500/30 font-semibold text-sm px-3 py-1"
    case "not_started":
      return "bg-slate-500/20 text-slate-300 border-slate-500/30 font-semibold text-sm px-3 py-1"
    case "running":
      return "bg-blue-500/20 text-blue-300 border-blue-500/30 font-semibold text-sm px-3 py-1"
    case "judging":
      return "bg-purple-500/20 text-purple-300 border-purple-500/30 font-semibold text-sm px-3 py-1"
    case "completed":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-semibold text-sm px-3 py-1"
    default:
      return "bg-slate-500/20 text-slate-300 border-slate-500/30 font-semibold text-sm px-3 py-1"
  }
}

