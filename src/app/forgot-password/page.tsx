import { ForgotPasswordClient } from "./forgot-password-client"

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const params = await searchParams
  return <ForgotPasswordClient initialEmail={params?.email} />
}
