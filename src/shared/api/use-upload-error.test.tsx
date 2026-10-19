import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test';

import { ApiError } from './error';
import { useUploadErrorMessage } from './use-upload-error';

function Described({ code }: { code: string }) {
  const describe = useUploadErrorMessage();

  return (
    <p>{describe(new ApiError({ message: `server says ${code}`, status: 409, code }))}</p>
  );
}

describe('useUploadErrorMessage', () => {
  it('words a malware refusal so the person knows what happened', () => {
    renderWithProviders(<Described code="FILE_INFECTED" />);

    expect(screen.getByText(/malware and was deleted/)).toBeInTheDocument();
  });

  it('tells the person to retry when the scanner is away', () => {
    renderWithProviders(<Described code="MALWARE_SCAN_UNAVAILABLE" />);

    expect(screen.getByText(/Try again in a moment/)).toBeInTheDocument();
  });

  it('passes any other message through', () => {
    renderWithProviders(<Described code="SOMETHING_ELSE" />);

    expect(screen.getByText('server says SOMETHING_ELSE')).toBeInTheDocument();
  });
});
