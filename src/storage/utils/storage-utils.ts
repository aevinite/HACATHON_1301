import { createClient } from "@/lib/supabase-server"
import {
  BUCKETS,
  BUCKET_CONFIG,
  PUBLIC_BUCKETS,
  PRIVATE_BUCKETS,
  type BucketName,
} from "../constants/buckets"
import { PATH_GENERATORS, getFileExtension } from "../constants/paths"
import { CACHE_STRATEGY } from "../constants/cache"
import { FileValidator } from "../validators/file-validator"

export class StorageService {
  private static async getClient() {
    return createClient()
  }

  static async getPublicUrl(bucket: BucketName, path: string) {
    const supabase = await this.getClient()
    const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
      transform: BUCKET_CONFIG[bucket].public
        ? {
            width: 800,
            quality: 85,
          }
        : undefined,
    })
    return data.publicUrl
  }

  static async getSignedUrl(
    bucket: BucketName,
    path: string,
    expiresIn: number = CACHE_STRATEGY.SIGNED_URL.expiration
  ) {
    const supabase = await this.getClient()
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) throw error
    return data.signedUrl
  }

  static async uploadFile(
    bucket: BucketName,
    path: string,
    file: File | Buffer,
    options?: {
      contentType?: string
      upsert?: boolean
      cacheControl?: string
    }
  ) {
    const supabase = await this.getClient()
    const config = BUCKET_CONFIG[bucket]

    const cacheControl =
      options?.cacheControl ||
      (config.public
        ? `public, max-age=${CACHE_STRATEGY.PUBLIC.maxAge}, s-maxage=${CACHE_STRATEGY.PUBLIC.sMaxAge}, stale-while-revalidate=${CACHE_STRATEGY.PUBLIC.staleWhileRevalidate}`
        : `private, max-age=${CACHE_STRATEGY.PRIVATE.maxAge}`)

    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: options?.contentType,
      cacheControl,
      upsert: options?.upsert ?? false,
    })

    if (error) throw error
    return data
  }

  static async deleteFile(bucket: BucketName, path: string) {
    const supabase = await this.getClient()
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) throw error
    return true
  }

  static async deleteFiles(bucket: BucketName, paths: string[]) {
    const supabase = await this.getClient()
    const { error } = await supabase.storage.from(bucket).remove(paths)
    if (error) throw error
    return true
  }

  static async listFiles(bucket: BucketName, path: string = "") {
    const supabase = await this.getClient()
    const { data, error } = await supabase.storage.from(bucket).list(path)
    if (error) throw error
    return data
  }
}

export class ImageTransformationService {
  static getOptimizedUrl(
    bucket: BucketName,
    path: string,
    options: {
      width?: number
      height?: number
      quality?: number
      format?: "webp" | "jpg" | "png"
    }
  ) {
    const baseUrl = StorageService.getPublicUrl(bucket, path)
    const params = new URLSearchParams()

    if (options.width) params.append("width", options.width.toString())
    if (options.height) params.append("height", options.height.toString())
    if (options.quality) params.append("quality", options.quality.toString())
    if (options.format) params.append("format", options.format)

    return `${baseUrl}?${params.toString()}`
  }

  static getAvatarUrls(bucket: BucketName, path: string) {
    return {
      tiny: this.getOptimizedUrl(bucket, path, { width: 64, quality: 85, format: "webp" }),
      small: this.getOptimizedUrl(bucket, path, { width: 128, quality: 85, format: "webp" }),
      medium: this.getOptimizedUrl(bucket, path, { width: 256, quality: 85, format: "webp" }),
      large: this.getOptimizedUrl(bucket, path, { width: 512, quality: 85, format: "webp" }),
    }
  }

  static getProjectCoverUrls(bucket: BucketName, path: string) {
    return {
      thumbnail: this.getOptimizedUrl(bucket, path, { width: 400, quality: 85, format: "webp" }),
      small: this.getOptimizedUrl(bucket, path, { width: 800, quality: 85, format: "webp" }),
      medium: this.getOptimizedUrl(bucket, path, { width: 1200, quality: 85, format: "webp" }),
      large: this.getOptimizedUrl(bucket, path, { width: 1600, quality: 85, format: "webp" }),
    }
  }
}
