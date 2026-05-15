export const CACHE_STRATEGY = {
  PUBLIC: {
    maxAge: 31536000, // 1 year
    sMaxAge: 31536000,
    staleWhileRevalidate: 86400, // 1 day
  },
  PRIVATE: {
    maxAge: 3600, // 1 hour
    sMaxAge: 3600,
  },
  SIGNED_URL: {
    expiration: 3600, // 1 hour (3600 seconds)
  },
} as const

export const IMAGE_TRANSFORMATION = {
  AVATAR: {
    sizes: [64, 128, 256, 512],
    quality: 85,
    format: "webp",
  },
  PROJECT_COVER: {
    sizes: [400, 800, 1200, 1600],
    quality: 85,
    format: "webp",
    aspectRatio: "16:9",
  },
  HACKATHON_BANNER: {
    sizes: [800, 1200, 1600, 2000],
    quality: 85,
    format: "webp",
    aspectRatio: "21:9",
  },
} as const

export const CLEANUP_STRATEGY = {
  ORPHAN_FILE_DAYS: 30, // Delete files not referenced in DB after 30 days
  EXPORT_FILE_DAYS: 90, // Delete exports after 90 days
} as const
