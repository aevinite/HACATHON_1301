"use client"

import {
  LayoutDashboard,
  Users,
  Trophy,
  FileText,
  Settings,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Participants", href: "/dashboard/participants", icon: Users },
  { label: "Judging", href: "/dashboard/judging", icon: Trophy },
  { label: "Submissions", href: "/dashboard/submissions", icon: FileText },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 p-6">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="h-6 w-6 text-blue-500" />
          HackJudge
        </h1>
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                pathname === item.href
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto pt-10">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  )
}
