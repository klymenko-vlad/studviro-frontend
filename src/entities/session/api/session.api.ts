import { toApiError, type UserResponseDto } from '@/shared/api';

/**
 * Client-side calls to the BFF, not to the API.
 *
 * These are the one part of the app that deliberately does *not* go through the
 * generated SDK: `/api/auth/*` are our own Route Handlers, they are absent from
 * the backend's OpenAPI document, and their whole purpose is to keep the tokens
 * the SDK would otherwise carry out of the browser entirely.
 */

const AUTH = '/api/auth';

export interface SessionResponse {
  user: UserResponseDto;
}

async function post(path: string, body?: unknown): Promise<Response> {
  return fetch(`${AUTH}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    // The handlers set httpOnly cookies; without this the browser discards them.
    credentials: 'same-origin',
  });
}

async function unwrap(response: Response): Promise<SessionResponse> {
  if (!response.ok) {
    // The handlers relay the API's own `ErrorResponseDto`, so `toApiError`
    // recognises it and the UI gets the backend's wording and code.
    throw toApiError(await response.json().catch(() => null));
  }

  return (await response.json()) as SessionResponse;
}

export const sessionApi = {
  signIn: async (credentials: { email: string; password: string; captcha?: string }) =>
    unwrap(await post('login', credentials)),

  signUp: async (details: {
    email: string;
    displayName: string;
    password: string;
    captcha?: string;
  }) => unwrap(await post('register', details)),

  completeTwoFactor: async (answer: { code: string }) =>
    unwrap(await post('login/two-factor', answer)),

  changePassword: async (change: { currentPassword: string; newPassword: string }) =>
    unwrap(await post('password', change)),

  signOut: async (): Promise<void> => {
    await post('logout');
  },
} as const;
