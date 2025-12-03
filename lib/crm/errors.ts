/**
 * CRM Error Handling Utilities
 * Standardized error format matching Attio's error structure
 */

export enum ErrorType {
  VALIDATION_ERROR = 'validation_error',
  NOT_FOUND = 'not_found',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INTERNAL_SERVER_ERROR = 'internal_server_error',
  INVALID_FILTER = 'invalid_filter',
  MULTIPLE_MATCH_RESULTS = 'multiple_match_results',
  CONFLICT = 'conflict',
  BAD_REQUEST = 'bad_request',
}

export interface ErrorDetails {
  field?: string
  reason?: string
  [key: string]: any
}

export interface StructuredError {
  status_code: number
  type: ErrorType
  code: string
  message: string
  details?: ErrorDetails
}

/**
 * Create a structured error response
 */
export function createError(
  type: ErrorType,
  code: string,
  message: string,
  statusCode: number,
  details?: ErrorDetails
): StructuredError {
  return {
    status_code: statusCode,
    type,
    code,
    message,
    ...(details && { details }),
  }
}

/**
 * Predefined error creators
 */
export const Errors = {
  validation: (message: string, details?: ErrorDetails) =>
    createError(ErrorType.VALIDATION_ERROR, 'VALIDATION_ERROR', message, 400, details),

  notFound: (resource: string = 'Resource') =>
    createError(ErrorType.NOT_FOUND, 'NOT_FOUND', `${resource} not found`, 404),

  unauthorized: (message: string = 'Authentication required') =>
    createError(ErrorType.UNAUTHORIZED, 'UNAUTHORIZED', message, 401),

  forbidden: (message: string = 'Permission denied') =>
    createError(ErrorType.FORBIDDEN, 'FORBIDDEN', message, 403),

  rateLimitExceeded: (retryAfter?: number) =>
    createError(
      ErrorType.RATE_LIMIT_EXCEEDED,
      'RATE_LIMIT_EXCEEDED',
      'Rate limit exceeded',
      429,
      retryAfter ? { retry_after: retryAfter } : undefined
    ),

  invalidFilter: (reason: string, details?: ErrorDetails) =>
    createError(ErrorType.INVALID_FILTER, 'INVALID_FILTER', `Invalid filter: ${reason}`, 400, details),

  multipleMatchResults: (count: number) =>
    createError(
      ErrorType.MULTIPLE_MATCH_RESULTS,
      'MULTIPLE_MATCH_RESULTS',
      `Multiple records match the criteria (${count} found)`,
      409,
      { match_count: count }
    ),

  conflict: (message: string, details?: ErrorDetails) =>
    createError(ErrorType.CONFLICT, 'CONFLICT', message, 409, details),

  badRequest: (message: string, details?: ErrorDetails) =>
    createError(ErrorType.BAD_REQUEST, 'BAD_REQUEST', message, 400, details),

  internal: (message: string = 'Internal server error') =>
    createError(ErrorType.INTERNAL_SERVER_ERROR, 'INTERNAL_SERVER_ERROR', message, 500),
}

/**
 * Error code reference for documentation
 */
export const ErrorCodes = {
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    status: 400,
    description: 'Input validation failed',
    examples: ['Missing required field', 'Invalid email format', 'Value out of range'],
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    status: 404,
    description: 'Resource not found',
    examples: ['Person not found', 'Company not found', 'Conversation not found'],
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    status: 401,
    description: 'Authentication required',
    examples: ['Missing authentication token', 'Invalid token'],
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    status: 403,
    description: 'Permission denied',
    examples: ['Insufficient permissions', 'Workspace access denied'],
  },
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    status: 429,
    description: 'Too many requests',
    examples: ['API rate limit exceeded', 'Too many requests per minute'],
  },
  INVALID_FILTER: {
    code: 'INVALID_FILTER',
    status: 400,
    description: 'Filter syntax is invalid',
    examples: ['Unsupported filter operator', 'Invalid filter path', 'Malformed filter JSON'],
  },
  MULTIPLE_MATCH_RESULTS: {
    code: 'MULTIPLE_MATCH_RESULTS',
    status: 409,
    description: 'Multiple records match the criteria',
    examples: ['Multiple people match email', 'Multiple companies match domain'],
  },
  CONFLICT: {
    code: 'CONFLICT',
    status: 409,
    description: 'Resource conflict',
    examples: ['Tag name already exists', 'Email already in use'],
  },
  BAD_REQUEST: {
    code: 'BAD_REQUEST',
    status: 400,
    description: 'Bad request',
    examples: ['Invalid request format', 'Missing required parameters'],
  },
  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    status: 500,
    description: 'Internal server error',
    examples: ['Database connection failed', 'Unexpected error occurred'],
  },
} as const

