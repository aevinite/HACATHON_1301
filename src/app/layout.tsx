import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/providers/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { QueryProvider } from "@/lib/query-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HackJudge - Hackathon Judging Platform",
  description: "A modern hackathon judging and scoring platform",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
