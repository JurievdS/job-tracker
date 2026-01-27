/**
 * Custom Error Classes
 *
 * Defines application-specific error classes for consistent error handling.
 */

/**
 * Base application error class
 * All custom errors should extend this
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request - Invalid input data
 */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(400, message);
  }
}

/**
 * 401 Unauthorized - Missing or invalid authentication
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

/**
 * 403 Forbidden - Authenticated but not allowed
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(403, message);
  }
}

/**
 * 404 Not Found - Resource doesn't exist or user doesn't have access
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

/**
 * 409 Conflict - Resource already exists or state conflict
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(409, message);
  }
}

/**
 * 422 Unprocessable Entity - Validation failed
 */
export class ValidationError extends AppError {
  constructor(
    message = 'Validation failed',
    public errors?: Record<string, string[]>
  ) {
    super(422, message);
  }
}
