export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly errors: unknown[];

  constructor(status: number, message: string, options?: { code?: string; errors?: unknown[] }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = options?.code;
    this.errors = options?.errors ?? [];
  }

  static badRequest(message: string, errors: unknown[] = []) {
    return new ApiError(400, message, { errors });
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message, { code: 'UNAUTHORIZED' });
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, message, { code: 'FORBIDDEN' });
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message, { code: 'NOT_FOUND' });
  }

  static conflict(message: string) {
    return new ApiError(409, message, { code: 'CONFLICT' });
  }

  static tooManyRequests(message = 'Too many requests, please try again later') {
    return new ApiError(429, message, { code: 'RATE_LIMITED' });
  }

  static serviceUnavailable(message: string, code = 'SERVICE_UNAVAILABLE') {
    return new ApiError(503, message, { code });
  }
}
