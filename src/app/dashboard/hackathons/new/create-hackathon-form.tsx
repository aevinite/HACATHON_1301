
"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Upload, X, FileText } from "lucide-react"
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
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [problemFile, setProblemFile] = useState<File | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const formId = "create-hackathon-form"

  const MAX_BANNER_SIZE = 5 * 1024 * 1024 // 5MB
  const MAX_PDF_SIZE = 10 * 1024 * 1024 // 10MB

  const validateFiles = (): boolean => {
    if (bannerFile) {
      if (!bannerFile.type.startsWith("image/")) {
        setClientError("Banner must be an image file.")
        return false
      }
      if (bannerFile.size > MAX_BANNER_SIZE) {
        setClientError("File upload is too large. Banner must be under 5MB and problem statement PDF under 10MB.")
        return false
      }
    }

    if (problemFile) {
      if (problemFile.type !== "application/pdf") {
        setClientError("Problem statement must be a PDF file.")
        return false
      }
      if (problemFile.size > MAX_PDF_SIZE) {
        setClientError("File upload is too large. Banner must be under 5MB and problem statement PDF under 10MB.")
        return false
      }
    }

    setClientError(null)
    return true
  }

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setBannerPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearBannerFile = () => {
    setBannerFile(null)
    setBannerPreview(null)
  }

  const handleProblemFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProblemFile(file)
    }
  }

  const clearProblemFile = () => {
    setProblemFile(null)
  }

  const handleSubmit = (formData: FormData) => {
    if (!validateFiles()) {
      return
    }
    if (bannerFile) {
      formData.append("banner_file", bannerFile)
    }
    if (problemFile) {
      formData.append("problem_file", problemFile)
    }
    formAction(formData)
  }

  return (
    <div className="p-6 md:p-8 lg:p-10 pb-10">
      <form id={formId} action={handleSubmit} className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="mb-8">
          <Link href="/dashboard/hackathons" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Hackathons
          </Link>
        </div>

        {(state.formError || clientError) && (
          <div className="text-sm text-red-500 bg-red-50 p-4 rounded-lg border border-red-200">
            {state.formError || clientError}
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
            <CardTitle>Media & Banner</CardTitle>
            <CardDescription>Add a banner image for your hackathon</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bannerPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-blue-500/30">
                <img src={bannerPreview} alt="Banner preview" className="w-full h-48 object-contain" />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={clearBannerFile}
                >
                  <X className="h-4 w-4" />
                </Button>
                <p className="text-sm text-muted-foreground mt-2 px-2 pb-2">
                  {bannerFile?.name}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="banner_file">Upload Banner Image</Label>
                <Input
                  id="banner_file"
                  name="banner_file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleBannerFileChange}
                  className="border border-blue-500 focus-visible:ring-blue-500"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Problem Statement */}
        <Card className="mb-20">
          <CardHeader>
            <CardTitle>Problem Statement</CardTitle>
            <CardDescription>Upload the challenge problem statement PDF</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {problemFile ? (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{problemFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(problemFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button type="button" variant="destructive" size="sm" onClick={clearProblemFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="problem_file">Upload Problem Statement PDF</Label>
                <Input
                  id="problem_file"
                  name="problem_file"
                  type="file"
                  accept="application/pdf"
                  onChange={handleProblemFileChange}
                  className="border border-blue-500 focus-visible:ring-blue-500"
                />
              </div>
            )}
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
