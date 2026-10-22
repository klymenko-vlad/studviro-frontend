import { ApiError } from './error';
import type { UploadTicketResponseDto } from './generated/types.gen';

export type UploadTicket = UploadTicketResponseDto;

/**
 * Why this is not a call on the generated client: bytes never pass through the
 * API (ADR 0027). The server signs a `PUT`, the browser writes straight to the
 * object store, and only then does the server confirm what the store received.
 * So this request must carry exactly the ticket's headers, no bearer token and
 * no `/api/proxy` prefix — none of which the generated client would allow.
 *
 * `XMLHttpRequest` rather than `fetch`, because upload progress is the one
 * thing `fetch` still cannot report.
 */
export function uploadToTicket(
  ticket: UploadTicket,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  if (file.size > ticket.maxBytes) {
    return Promise.reject(
      new ApiError({
        message: 'The file is larger than the store will accept',
        status: 413,
        code: 'UPLOAD_TOO_LARGE',
      }),
    );
  }

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open('PUT', ticket.url, true);

    for (const [name, value] of Object.entries(ticket.headers)) {
      request.setRequestHeader(name, value);
    }

    request.upload.addEventListener('progress', event => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });

    const fail = (status: number) => {
      reject(
        new ApiError({
          message: 'The file could not be written to the store',
          status,
          code: 'UPLOAD_FAILED',
        }),
      );
    };

    request.addEventListener('load', () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      fail(request.status);
    });
    request.addEventListener('error', () => {
      fail(0);
    });
    request.addEventListener('abort', () => {
      fail(0);
    });

    request.send(file);
  });
}

/**
 * The first two of the three steps, kept together so they cannot drift apart:
 * ask the API for a ticket, then write the bytes to the store. The third step —
 * telling the API what to record — is the caller's, and because this rejects
 * rather than returning a partial result, a failed `PUT` can never reach it.
 * An abandoned object in the bucket is the cost; a half-created row is not.
 */
export async function uploadViaTicket(
  requestTicket: (request: {
    filename: string;
    contentType: string;
  }) => Promise<UploadTicket>,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ storageKey: string; filename: string }> {
  const ticket = await requestTicket({
    filename: file.name,
    contentType: file.type === '' ? 'application/octet-stream' : file.type,
  });

  await uploadToTicket(ticket, file, onProgress);

  return { storageKey: ticket.key, filename: file.name };
}
