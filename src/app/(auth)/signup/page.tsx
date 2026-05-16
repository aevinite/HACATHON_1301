
import { requireGuest } from "@/features/auth"
import { SignupForm } from "@/features/auth/components/signup-form"

export default async function SignupPage() {
  await requireGuest()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <SignupForm />
    </div>
  )
}

