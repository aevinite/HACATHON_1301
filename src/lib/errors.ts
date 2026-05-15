export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class AuthError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(message, "AUTH_ERROR", 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access forbidden") {
    super(message, "FORBIDDEN", 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, "NOT_FOUND", 404)
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Validation failed", details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details)
  }
}

export class UploadError extends AppError {
  constructor(message: string = "Upload failed") {
    super(message, "UPLOAD_ERROR", 400)
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (error instanceof Error) {
    return new AppError(error.message, "UNKNOWN_ERROR", 500, error)
  }
  return new AppError("An unknown error occurred", "UNKNOWN_ERROR", 500, error)
}
