import { BUCKET_CONFIG, type BucketName } from "../constants/buckets"
import { getFileExtension } from "../constants/paths"

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export interface FileValidationOptions {
  bucket: BucketName
  file: File
}

export class FileValidator {
  static validate(options: FileValidationOptions): ValidationResult {
    const { bucket, file } = options
    const config = BUCKET_CONFIG[bucket]
    const errors: string[] = []

    if (!config) {
      return { valid: false, errors: [`Unknown bucket: ${bucket}`] }
    }

    if (!file) {
      return { valid: false, errors: ["No file provided"] }
    }

    if (file.size > config.maxSize) {
      const sizeMB = (config.maxSize / (1024 * 1024)).toFixed(0)
      errors.push(`File size exceeds ${sizeMB}MB limit`)
    }

    if (!(config.allowedMimeTypes as unknown as string[]).includes(file.type)) {
      errors.push(
        `Invalid file type. Allowed: ${config.allowedMimeTypes.join(", ")}`
      )
    }

    const extension = getFileExtension(file.type)
    if (extension && !(config.allowedExtensions as unknown as string[]).includes(extension)) {
      errors.push(
        `Invalid file extension. Allowed: ${config.allowedExtensions.join(", ")}`
      )
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  static validateImageDimensions(
    file: File,
    options: { minAspectRatio?: number; maxAspectRatio?: number }
  ): Promise<ValidationResult> {
    return new Promise((resolve) => {
      const errors: string[] = []
      const url = URL.createObjectURL(file)
      const img = new Image()

      img.onload = () => {
        URL.revokeObjectURL(url)
        const aspectRatio = img.width / img.height

        if (options.minAspectRatio && aspectRatio < options.minAspectRatio) {
          errors.push(
            `Image aspect ratio too narrow. Minimum: ${options.minAspectRatio.toFixed(2)}`
          )
        }

        if (options.maxAspectRatio && aspectRatio > options.maxAspectRatio) {
          errors.push(
            `Image aspect ratio too wide. Maximum: ${options.maxAspectRatio.toFixed(2)}`
          )
        }

        resolve({ valid: errors.length === 0, errors })
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        errors.push("Failed to load image for dimension validation")
        resolve({ valid: false, errors })
      }

      img.src = url
    })
  }

  static sanitizeFileName(fileName: string): string {
    return fileName
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }
}
