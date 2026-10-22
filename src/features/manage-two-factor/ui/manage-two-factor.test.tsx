import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { errorResponse, renderWithProviders, screen, server } from '@/shared/test';

import { ManageTwoFactor } from './manage-two-factor';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const BASE = '/api/proxy/api/v1/users/me/two-factor';
const CODES = Array.from(
  { length: 10 },
  (_, index) => `abcde-fgh${String(index).padStart(2, '0')}`,
);

const setup = {
  secret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
  otpauthUri: 'otpauth://totp/StudViro:ada%40example.com?secret=JBSW',
  qrCodeDataUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
};

function enabledStatus(recoveryCodesRemaining = 10) {
  return { enabled: true, enabledAt: '2026-09-01T10:00:00.000Z', recoveryCodesRemaining };
}

describe('ManageTwoFactor', () => {
  it('pairs an authenticator and shows the recovery codes once', async () => {
    let enabled = false;
    server.use(
      http.get(BASE, () =>
        HttpResponse.json(
          enabled
            ? enabledStatus()
            : { enabled: false, enabledAt: null, recoveryCodesRemaining: 0 },
        ),
      ),
      http.post(`${BASE}/setup`, () => HttpResponse.json(setup)),
      http.post(`${BASE}/enable`, () => {
        enabled = true;
        return HttpResponse.json({ recoveryCodes: CODES });
      }),
    );
    const { user } = renderWithProviders(<ManageTwoFactor />);

    await user.click(
      await screen.findByRole('button', { name: 'Turn on two-step verification' }),
    );
    await user.type(screen.getByLabelText(/^Password/), 'correct horse battery staple');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      await screen.findByRole('img', {
        name: 'QR code to scan with your authenticator app',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('JBSW Y3DP EHPK 3PXP JBSW Y3DP EHPK 3PXP'),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^Code from the app/), '123 456');
    await user.click(screen.getByRole('button', { name: 'Turn on' }));

    const list = await screen.findByRole('list', { name: 'Recovery codes' });
    expect(list.querySelectorAll('li')).toHaveLength(10);

    await user.click(screen.getByRole('button', { name: 'I have saved them' }));
    expect(await screen.findByText('On since Sep 1, 2026')).toBeInTheDocument();
    expect(screen.queryByText(CODES[0]!)).not.toBeInTheDocument();
  });

  it('stays on the password step when the password is wrong', async () => {
    server.use(
      http.post(`${BASE}/setup`, () =>
        HttpResponse.json(
          {
            ...errorResponse(400, 'The current password is incorrect'),
            code: 'CURRENT_PASSWORD_INCORRECT',
          },
          { status: 400 },
        ),
      ),
    );
    const { user } = renderWithProviders(<ManageTwoFactor />);

    await user.click(
      await screen.findByRole('button', { name: 'Turn on two-step verification' }),
    );
    await user.type(screen.getByLabelText(/^Password/), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('That is not your password.')).toBeInTheDocument();
  });

  it('keeps the pairing open when the code does not match', async () => {
    server.use(
      http.post(`${BASE}/setup`, () => HttpResponse.json(setup)),
      http.post(`${BASE}/enable`, () =>
        HttpResponse.json(
          {
            ...errorResponse(400, 'That code is not valid'),
            code: 'TWO_FACTOR_CODE_INVALID',
          },
          { status: 400 },
        ),
      ),
    );
    const { user } = renderWithProviders(<ManageTwoFactor />);

    await user.click(
      await screen.findByRole('button', { name: 'Turn on two-step verification' }),
    );
    await user.type(screen.getByLabelText(/^Password/), 'correct horse battery staple');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.type(await screen.findByLabelText(/^Code from the app/), '000000');
    await user.click(screen.getByRole('button', { name: 'Turn on' }));

    expect(
      await screen.findByText(
        'That code did not match. Check the time on your phone and try the newest code.',
      ),
    ).toBeInTheDocument();
  });

  it('warns when recovery codes run low, and replaces them', async () => {
    server.use(
      http.get(BASE, () => HttpResponse.json(enabledStatus(2))),
      http.post(`${BASE}/recovery-codes`, () =>
        HttpResponse.json({ recoveryCodes: CODES }),
      ),
    );
    const { user } = renderWithProviders(<ManageTwoFactor />);

    expect(await screen.findByText('2 recovery codes left')).toBeInTheDocument();
    expect(screen.getByText('Running low')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Get new recovery codes' }));
    await user.type(screen.getByLabelText(/^Password/), 'correct horse battery staple');
    await user.click(screen.getByRole('button', { name: 'Get new recovery codes' }));

    expect(
      await screen.findByRole('list', { name: 'Recovery codes' }),
    ).toBeInTheDocument();
  });

  it('turns off after the password is confirmed', async () => {
    let disabled = false;
    server.use(
      http.get(BASE, () =>
        HttpResponse.json(
          disabled
            ? { enabled: false, enabledAt: null, recoveryCodesRemaining: 0 }
            : enabledStatus(),
        ),
      ),
      http.post(`${BASE}/disable`, () => {
        disabled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user } = renderWithProviders(<ManageTwoFactor />);

    await user.click(await screen.findByRole('button', { name: 'Turn off' }));
    await user.type(screen.getByLabelText(/^Password/), 'correct horse battery staple');
    await user.click(screen.getByRole('button', { name: 'Turn off' }));

    expect(
      await screen.findByRole('button', { name: 'Turn on two-step verification' }),
    ).toBeInTheDocument();
  });

  it('can be cancelled without changing anything', async () => {
    const { user } = renderWithProviders(<ManageTwoFactor />);

    await user.click(
      await screen.findByRole('button', { name: 'Turn on two-step verification' }),
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      screen.getByRole('button', { name: 'Turn on two-step verification' }),
    ).toBeInTheDocument();
  });
});
