
import { requireGuest } from "@/features/auth"
import { LoginForm } from "@/features/auth/components/login-form"

export default async function LoginPage({ searchParams }: { searchParams: { message?: string } }) {
  await requireGuest()
  
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="w-full max-w-6xl mx-auto">
        <LoginForm message={searchParams.message} />
      </div>
    </div>
  )
}

