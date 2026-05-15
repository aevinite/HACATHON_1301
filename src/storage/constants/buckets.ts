export const BUCKETS = {
  PUBLIC: {
    AVATARS: "public-avatars",
    PROJECT_COVERS: "public-project-covers",
    HACKATHON_BANNERS: "public-hackathon-banners",
  },
  PRIVATE: {
    PROBLEM_STATEMENTS: "private-problem-statements",
    EXPORTS: "private-exports",
    DEMO_ASSETS: "private-demo-assets",
  },
} as const

export type BucketName =
  | typeof BUCKETS.PUBLIC.AVATARS
  | typeof BUCKETS.PUBLIC.PROJECT_COVERS
  | typeof BUCKETS.PUBLIC.HACKATHON_BANNERS
  | typeof BUCKETS.PRIVATE.PROBLEM_STATEMENTS
  | typeof BUCKETS.PRIVATE.EXPORTS
  | typeof BUCKETS.PRIVATE.DEMO_ASSETS

export const PUBLIC_BUCKETS: BucketName[] = Object.values(BUCKETS.PUBLIC)
export const PRIVATE_BUCKETS: BucketName[] = Object.values(BUCKETS.PRIVATE)

export const BUCKET_CONFIG = {
  [BUCKETS.PUBLIC.AVATARS]: {
    public: true,
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
  },
  [BUCKETS.PUBLIC.PROJECT_COVERS]: {
    public: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
    aspectRatio: {
      min: 1.3, // 4:3
      max: 2.0, // 2:1
    },
  },
  [BUCKETS.PUBLIC.HACKATHON_BANNERS]: {
    public: true,
    maxSize: 15 * 1024 * 1024, // 15MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
    aspectRatio: {
      min: 2.0, // 2:1
      max: 4.0, // 4:1
    },
  },
  [BUCKETS.PRIVATE.PROBLEM_STATEMENTS]: {
    public: false,
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: ["application/pdf"],
    allowedExtensions: [".pdf"],
  },
  [BUCKETS.PRIVATE.EXPORTS]: {
    public: false,
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: [
      "application/pdf",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    allowedExtensions: [".pdf", ".csv", ".xlsx"],
  },
  [BUCKETS.PRIVATE.DEMO_ASSETS]: {
    public: false,
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: ["video/mp4", "video/webm", "application/zip"],
    allowedExtensions: [".mp4", ".webm", ".zip"],
  },
} as const
