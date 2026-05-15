export const SCORING_CONFIG = {
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  MIN_CRITERIA_SCORE: 0,
} as const

export const REALTIME_CHANNELS = {
  LEADERBOARD: (hackathonId: string) => `hackathon:${hackathonId}:leaderboard`,
  PROJECT_SCORES: (projectId: string) => `project:${projectId}:scores`,
  JUDGE_PROGRESS: (hackathonId: string, judgeId: string) =>
    `hackathon:${hackathonId}:judge:${judgeId}:progress`,
} as const
