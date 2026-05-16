"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  FileText,
  Trophy,
  Settings,
  Menu,
  X,
  Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NavItem {
  id: string
  title: string
  href: string
  icon: React.ReactNode
}

const getNavItems = (role: "admin" | "judge" | "team"): NavItem[] => {
  const base: NavItem[] = [
    {
      id: "dashboard",
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
  ]

  if (role === "admin") {
    return [
      ...base,
      {
        id: "manage-hackathons",
        title: "Manage Hackathons",
        href: "/dashboard/admin/hackathons",
        icon: <Trophy className="h-5 w-5" />,
      },
      {
        id: "manage-users",
        title: "Manage Users",
        href: "/dashboard/admin/users",
        icon: <Users className="h-5 w-5" />,
      },
      {
        id: "manage-judges",
        title: "Manage Judges",
        href: "/dashboard/admin/judges",
        icon: <Users className="h-5 w-5" />,
      },
      {
        id: "manage-projects",
        title: "Manage Projects",
        href: "/dashboard/admin/projects",
        icon: <FileText className="h-5 w-5" />,
      },
      {
        id: "manage-teams",
        title: "Manage Teams",
        href: "/dashboard/admin/teams",
        icon: <Users className="h-5 w-5" />,
      },
      {
        id: "leaderboard",
        title: "Leaderboard",
        href: "/dashboard/leaderboard",
        icon: <Award className="h-5 w-5" />,
      },
      {
        id: "settings",
        title: "Settings",
        href: "/dashboard/settings",
        icon: <Settings className="h-5 w-5" />,
      },
    ]
  }

  if (role === "judge") {
    return [
      ...base,
      {
        id: "leaderboard",
        title: "Leaderboard",
        href: "/dashboard/leaderboard",
        icon: <Award className="h-5 w-5" />,
      },
      {
        id: "settings",
        title: "Settings",
        href: "/dashboard/settings",
        icon: <Settings className="h-5 w-5" />,
      },
    ]
  }

  return [
    ...base,
    {
      id: "hackathons",
      title: "Hackathons",
      href: "/dashboard/hackathons",
      icon: <Trophy className="h-5 w-5" />,
    },
    {
      id: "teams",
      title: "Teams",
      href: "/dashboard/teams",
      icon: <Users className="h-5 w-5" />,
    },
    {
      id: "projects",
      title: "Projects",
      href: "/dashboard/projects",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: "leaderboard",
      title: "Results",
      href: "/dashboard/leaderboard",
      icon: <Award className="h-5 w-5" />,
    },
    {
      id: "settings",
      title: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]
}

interface AppShellProps {
  children: React.ReactNode
  role?: "admin" | "judge" | "team"
}

export function AppShell({ children, role = "team" }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const pathname = usePathname()
  const navItems = getNavItems(role)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Trophy className="h-6 w-6" />
            <span>HackJudge</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-background border-r p-4">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon}
                  {item.title}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Layout */}
      <div className="hidden md:flex">
        {/* Desktop Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 w-64 border-r bg-background">
          <div className="flex h-16 items-center gap-2 px-6 font-semibold text-lg">
            <Trophy className="h-6 w-6" />
            <span>HackJudge</span>
          </div>
          <nav className="space-y-1 px-3">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {item.icon}
                {item.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:pl-64">
          <div className="min-h-screen">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Main Content */}
      <main className="md:hidden">
        {children}
      </main>
    </div>
  )
}
