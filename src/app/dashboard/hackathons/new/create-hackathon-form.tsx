
"use client"

import { useActionState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createHackathonAction } from "@/features/hackathons/server/actions"

interface FormState {
  success?: boolean
  fieldErrors?: Record<string, string>
  formError?: string
  values?: Record<string, string | null>
}

export default function CreateHackathonForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(createHackathonAction, {})
  const formId = "create-hackathon-form"

  return (
    <div className="p-6 md:p-8 lg:p-10 pb-10">
      <form id={formId} action={formAction} className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="mb-8">
          <Link href="/dashboard/hackathons" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Hackathons
          </Link>
        </div>

        {state.formError && (
          <div className="text-sm text-red-500 bg-red-50 p-4 rounded-lg border border-red-200">
            {state.formError}
          </div>
        )}

        {/* Basic Details */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Details</CardTitle>
            <CardDescription>Set the core information for your hackathon</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className={state.fieldErrors?.name ? "text-red-500" : ""}>
                Hackathon Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="My Awesome Hackathon"
                defaultValue={state.values?.name || ""}
                aria-invalid={!!state.fieldErrors?.name}
                className={state.fieldErrors?.name ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {state.fieldErrors?.name && (
                <p className="text-sm text-red-500 font-medium">{state.fieldErrors?.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className={state.fieldErrors?.description ? "text-red-500" : ""}>
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your hackathon, what participants should build, and any other relevant details..."
                rows={4}
                defaultValue={state.values?.description || ""}
                aria-invalid={!!state.fieldErrors?.description}
                className={state.fieldErrors?.description ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {state.fieldErrors?.description && (
                <p className="text-sm text-red-500 font-medium">{state.fieldErrors?.description}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Flow</CardTitle>
            <CardDescription>Set dates in event order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-6">Set dates in event order.</p>
              <div className="space-y-8">
                {/* Registration Starts */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center bg-blue-500 border-blue-500">
                      <div className="w-2 h-2 rounded-full bg-background" />
                    </div>
                    <div className="w-0.5 h-full bg-muted-foreground/30 my-1" />
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="space-y-2">
                      <Label htmlFor="registration_start_date" className={state.fieldErrors?.registration_start_date ? "text-red-500" : ""}>
                        Registration Opens
                      </Label>
                      <Input
                        id="registration_start_date"
                        name="registration_start_date"
                        type="datetime-local"
                        defaultValue={state.values?.registration_start_date || ""}
                        aria-invalid={!!state.fieldErrors?.registration_start_date}
                        className={state.fieldErrors?.registration_start_date ? "border-red-500 focus-visible:ring-red-500" : ""}
                      />
                      {state.fieldErrors?.registration_start_date && (
                        <p className="text-sm text-red-500 font-medium">{state.fieldErrors?.registration_start_date}</p>
                      )}
                      <p className="text-xs text-muted-foreground">When registration opens</p>
                    </div>
                  </div>
                </div>

                {/* Registration Closes */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center bg-transparent border-muted-foreground">
                    </div>
                    <div className="w-0.5 h-full bg-muted-foreground/30 my-1" />
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="space-y-2">
                      <Label htmlFor="registration_deadline" className={state.fieldErrors?.registration_deadline ? "text-red-500" : ""}>
                        Registration Closes
                      </Label>
                      <Input
                        id="registration_deadline"
                        name="registration_deadline"
                        type="datetime-local"
                        defaultValue={state.values?.registration_deadline || ""}
                        aria-invalid={!!state.fieldErrors?.registration_deadline}
                        className={state.fieldErrors?.registration_deadline ? "border-red-500 focus-visible:ring-red-500" : ""}
                      />
                      {state.fieldErrors?.registration_deadline && (
                        <p className="text-sm text-red-500 font-medium">{state.fieldErrors?.registration_deadline}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Last date for teams to register</p>
                    </div>
                  </div>
                </div>

                {/* Hackathon Starts */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center bg-transparent border-muted-foreground">
                    </div>
                    <div className="w-0.5 h-full bg-muted-foreground/30 my-1" />
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="space-y-2">
                      <Label htmlFor="start_date" className={state.fieldErrors?.start_date ? "text-red-500" : ""}>
                        Hackathon Starts
                      </Label>
                      <Input
                        id="start_date"
                        name="start_date"
                        type="datetime-local"
                        defaultValue={state.values?.start_date || ""}
                        aria-invalid={!!state.fieldErrors?.start_date}
                        className={state.fieldErrors?.start_date ? "border-red-500 focus-visible:ring-red-500" : ""}
                      />
                      {state.fieldErrors?.start_date && (
                        <p className="text-sm text-red-500 font-medium">{state.fieldErrors?.start_date}</p>
                      )}
                      <p className="text-xs text-muted-foreground">When the hackathon officially starts</p>
                    </div>
                  </div>
                </div>

                {/* Submissions Close */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center bg-transparent border-muted-foreground">
                    </div>
                    <div className="w-0.5 h-full bg-muted-foreground/30 my-1" />
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="space-y-2">
                      <Label htmlFor="submission_deadline" className={state.fieldErrors?.submission_deadline ? "text-red-500" : ""}>
                        Submissions Close
                      </Label>
                      <Input
                        id="submission_deadline"
                        name="submission_deadline"
                        type="datetime-local"
                        defaultValue={state.values?.submission_deadline || ""}
                        aria-invalid={!!state.fieldErrors?.submission_deadline}
                        className={state.fieldErrors?.submission_deadline ? "border-red-500 focus-visible:ring-red-500" : ""}
                      />
                      {state.fieldErrors?.submission_deadline && (
                        <p className="text-sm text-red-500 font-medium">{state.fieldErrors?.submission_deadline}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Last date to submit projects</p>
                    </div>
                  </div>
                </div>

                {/* Judging Ends */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center bg-transparent border-muted-foreground">
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="space-y-2">
                      <Label htmlFor="judging_deadline" className={state.fieldErrors?.judging_deadline ? "text-red-500" : ""}>
                        Judging Ends
                      </Label>
                      <Input
                        id="judging_deadline"
                        name="judging_deadline"
                        type="datetime-local"
                        defaultValue={state.values?.judging_deadline || ""}
                        aria-invalid={!!state.fieldErrors?.judging_deadline}
                        className={state.fieldErrors?.judging_deadline ? "border-red-500 focus-visible:ring-red-500" : ""}
                      />
                      {state.fieldErrors?.judging_deadline && (
                        <p className="text-sm text-red-500 font-medium">{state.fieldErrors?.judging_deadline}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Last date for judges to score projects</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media / Banner */}
        <Card>
          <CardHeader>
            <CardTitle>Media &amp; Banner</CardTitle>
            <CardDescription>Add a banner image for your hackathon</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="banner_image">Banner Image URL</Label>
              <Input id="banner_image" name="banner_image" placeholder="https://example.com/banner.jpg" defaultValue={state.values?.banner_image || ""} />
              <p className="text-xs text-muted-foreground">
                Use a direct image URL ending in .jpg, .png, .webp, etc.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Problem Statement Note */}
        <Card className="mb-20">
          <CardHeader>
            <CardTitle>Problem Statement</CardTitle>
            <CardDescription>Detailed challenge description</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              PDF upload will be added later using Supabase Storage.
            </p>
          </CardContent>
        </Card>
      </form>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30">
        <div className="max-w-4xl mx-auto p-4 flex items-center gap-3 justify-between md:justify-end">
          <Link href="/dashboard/hackathons" className="hidden md:block">
            <Button variant="secondary" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" form={formId} disabled={isPending} className="flex-1 md:flex-none">
            {isPending ? "Creating..." : "Create Hackathon"}
          </Button>
        </div>
      </div>
    </div>
  )
}

