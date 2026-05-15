export const siteConfig = {
  name: "HackJudge",
  description: "A modern hackathon judging and scoring platform",
  url: "https://hackjudge.app",
  ogImage: "https://hackjudge.app/og.png",
  links: {
    github: "https://github.com/hackjudge",
  },
}

export const authConfig = {
  loginUrl: "/login",
  signupUrl: "/signup",
  dashboardUrl: "/dashboard",
  redirectAfterLogin: "/dashboard",
  redirectAfterLogout: "/login",
}

export const rolesConfig = {
  ADMIN: "admin",
  JUDGE: "judge",
  PARTICIPANT: "participant",
  ORGANIZER: "organizer",
} as const

export type UserRole = typeof rolesConfig[keyof typeof rolesConfig]

export const permissions = {
  [rolesConfig.ADMIN]: [
    "manage_users",
    "manage_teams",
    "manage_submissions",
    "manage_judging",
    "view_all",
    "edit_all",
    "delete_all",
  ],
  [rolesConfig.ORGANIZER]: [
    "manage_teams",
    "manage_submissions",
    "manage_judging",
    "view_all",
  ],
  [rolesConfig.JUDGE]: ["view_submissions", "score_submissions", "view_teams"],
  [rolesConfig.PARTICIPANT]: [
    "view_own_team",
    "create_submissions",
    "edit_own_submissions",
  ],
} as const
