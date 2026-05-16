
import { requireGuest } from "@/features/auth"
import { LoginForm } from "@/features/auth/components/login-form"

export default async function LoginPage() {
  await requireGuest()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <LoginForm />
    </div>
  )
}

