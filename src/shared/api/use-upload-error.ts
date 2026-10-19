'use client';

import { useTranslations } from 'next-intl';

import { toApiError } from './error';

const TRANSLATED = {
  FILE_INFECTED: 'infected',
  FILE_TOO_LARGE: 'tooLarge',
  FILE_TYPE_NOT_ALLOWED: 'typeNotAllowed',
} as const;

/** What the person is told when the server refuses an uploaded file. */
export function useUploadErrorMessage() {
  const t = useTranslations('uploads');

  return (error: unknown): string => {
    const apiError = toApiError(error);
    const key = TRANSLATED[apiError.code as keyof typeof TRANSLATED] as
      (typeof TRANSLATED)[keyof typeof TRANSLATED] | undefined;

    return key === undefined ? apiError.message : t(key);
  };
}
