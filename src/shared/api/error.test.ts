import { describe, expect, it } from 'vitest';

import { ApiError, toApiError } from './error';

describe('toApiError', () => {
  it('maps a server ErrorResponseDto', () => {
    const error = toApiError({
      statusCode: 404,
      error: 'Not Found',
      message: 'User not found',
      path: '/api/v1/users/1',
      requestId: 'req-1',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.code).toBe('Not Found');
    expect(error.requestId).toBe('req-1');
    expect(error.isNotFound).toBe(true);
    expect(error.isClientError).toBe(true);
  });

  it('surfaces the first validation message and keeps the rest', () => {
    const error = toApiError({
      statusCode: 400,
      error: 'Bad Request',
      message: ['email must be an email', 'password is too short'],
      path: '/api/v1/users',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    expect(error.message).toBe('email must be an email');
    expect(error.details).toHaveLength(2);
  });

  it('treats a transport failure as a retryable network error', () => {
    const error = toApiError(new TypeError('Failed to fetch'));

    expect(error.status).toBe(0);
    expect(error.isNetworkError).toBe(true);
    expect(error.isClientError).toBe(false);
  });

  it('never throws on an unrecognised value', () => {
    const error = toApiError('something odd');

    expect(error.code).toBe('UNKNOWN');
    expect(error.message).toBe('An unexpected error occurred');
  });

  it('passes an ApiError through unchanged', () => {
    const original = new ApiError({ message: 'nope', status: 401, code: 'Unauthorized' });

    expect(toApiError(original)).toBe(original);
    expect(original.isUnauthorized).toBe(true);
  });
});
