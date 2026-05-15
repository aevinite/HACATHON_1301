export const AUTH_ROUTES = {
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
} as const

export const PROTECTED_ROUTES = {
  DASHBOARD: "/dashboard",
} as const

export const AUTH_CONFIG = {
  SESSION_REFRESH_INTERVAL: 60 * 60 * 1000, // 1 hour
} as const
