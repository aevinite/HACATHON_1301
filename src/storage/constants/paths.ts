import { BUCKETS } from "./buckets"

export const PATH_GENERATORS = {
  avatar: (userId: string, timestamp: number = Date.now()) => {
    return `users/${userId}/avatar-${timestamp}`
  },
  projectCover: (hackathonId: string, projectId: string, timestamp: number = Date.now()) => {
    return `hackathons/${hackathonId}/projects/${projectId}/cover-${timestamp}`
  },
  hackathonBanner: (hackathonId: string, timestamp: number = Date.now()) => {
    return `hackathons/${hackathonId}/banner-${timestamp}`
  },
  problemStatement: (hackathonId: string, problemId: string, timestamp: number = Date.now()) => {
    return `hackathons/${hackathonId}/problems/${problemId}/statement-${timestamp}`
  },
  export: (hackathonId: string, exportType: string, timestamp: number = Date.now()) => {
    return `hackathons/${hackathonId}/exports/${exportType}-${timestamp}`
  },
  demoAsset: (hackathonId: string, projectId: string, assetId: string, timestamp: number = Date.now()) => {
    return `hackathons/${hackathonId}/projects/${projectId}/demo/${assetId}-${timestamp}`
  },
} as const

export const getFileExtension = (mimeType: string): string => {
  const mimeTypeMap: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
    "text/csv": ".csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "application/zip": ".zip",
  }
  return mimeTypeMap[mimeType] || ""
}
