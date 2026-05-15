import { QueryClient, defaultShouldDehydrateQuery, isServer } from "@tanstack/react-query"

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
        refetchOnWindowFocus: false,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  })

let clientQueryClientSingleton: QueryClient | undefined = undefined
export const getQueryClient = () => {
  if (isServer) {
    return createQueryClient()
  }
  if (!clientQueryClientSingleton) {
    clientQueryClientSingleton = createQueryClient()
  }
  return clientQueryClientSingleton
}

export const QUERY_KEYS = {
  auth: {
    session: ["auth", "session"],
    profile: ["auth", "profile"],
  },
  hackathons: {
    all: ["hackathons"],
    public: ["hackathons", "public"],
    detail: (id: string) => ["hackathons", id],
  },
  teams: {
    byHackathon: (hackathonId: string) => ["teams", hackathonId],
    detail: (id: string) => ["teams", id],
    myTeam: (hackathonId: string) => ["teams", "my", hackathonId],
  },
  projects: {
    byHackathon: (hackathonId: string) => ["projects", hackathonId],
    detail: (id: string) => ["projects", id],
    myProject: (hackathonId: string) => ["projects", "my", hackathonId],
  },
  scoring: {
    byProject: (projectId: string) => ["scoring", projectId],
    myScores: (hackathonId: string) => ["scoring", "my", hackathonId],
    judgeProgress: (hackathonId: string) => ["scoring", "progress", hackathonId],
  },
  leaderboard: {
    byHackathon: (hackathonId: string) => ["leaderboard", hackathonId],
  },
} as const
