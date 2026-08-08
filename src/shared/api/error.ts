import type { ErrorResponseDto } from './generated';

/**
 * Every failure the UI has to reason about, in one shape.
 *
 * The API returns `ErrorResponseDto` (see the backend's `AllExceptionsFilter`),
 * but a request can also fail before it ever reaches the server — DNS, offline,
 * abort, CORS. Collapsing both into one class means components render one error
 * path instead of guessing what they were handed.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** Present when the server answered; absent for transport failures. */
  readonly requestId: string | undefined;
  readonly details: string[];

  constructor(init: {
    message: string;
    status: number;
    code: string;
    requestId?: string | undefined;
    details?: string[];
  }) {
    super(init.message);
    this.name = 'ApiError';
    this.status = init.status;
    this.code = init.code;
    this.requestId = init.requestId;
    this.details = init.details ?? [];
  }

  /** 4xx means the caller must change something; retrying verbatim will not help. */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** Nothing reached the server — the only class of error worth retrying blindly. */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

/**
 * Only the two fields the filter always sets are asserted; `error` and
 * `requestId` are narrowed as optional so callers must handle their absence.
 */
type PartialErrorResponse = Partial<ErrorResponseDto> &
  Pick<ErrorResponseDto, 'statusCode' | 'message'>;

function isErrorResponseDto(value: unknown): value is PartialErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'statusCode' in value &&
    'message' in value
  );
}

/**
 * Converts anything a failed request can produce into an `ApiError`.
 * Safe to call on values of unknown provenance — it never throws.
 */
export function toApiError(error: unknown, status = 0): ApiError {
  if (error instanceof ApiError) return error;

  if (isErrorResponseDto(error)) {
    const messages = Array.isArray(error.message) ? error.message : [error.message];
    return new ApiError({
      // Validation failures arrive as a list; the first entry is the one a user
      // can act on, the rest are kept for field-level display.
      message: messages[0] ?? 'Request failed',
      status: error.statusCode,
      // Only `statusCode`/`message` are guaranteed by the guard; a hand-rolled
      // 4xx body can omit the rest without making the payload unusable.
      code: error.error ?? 'UNKNOWN',
      requestId: error.requestId,
      details: messages,
    });
  }

  if (error instanceof Error) {
    return new ApiError({
      message: error.message,
      status,
      code: error.name,
    });
  }

  return new ApiError({
    message: 'An unexpected error occurred',
    status,
    code: 'UNKNOWN',
  });
}
