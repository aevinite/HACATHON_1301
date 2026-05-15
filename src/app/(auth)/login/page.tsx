import { requireGuest } from "@/features/auth"
import { LoginForm } from "@/features/auth/components/login-form"

export default async function LoginPage() {
  console.log("LOGIN PAGE: Calling requireGuest()")
  await requireGuest()
  console.log("LOGIN PAGE: requireGuest() passed, rendering LoginForm")
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <LoginForm />
    </div>
  )
}
