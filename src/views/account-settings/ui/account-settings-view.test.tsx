import { describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import { renderAndAudit, renderWithProviders, screen } from '@/shared/test';

import { AccountSettingsView } from './account-settings-view';

vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const view = <AccountSettingsView displayName="Ada Lovelace" email="ada@example.com" />;

describe('AccountSettingsView', () => {
  it('puts profile, password, two-step verification and sessions on one page', async () => {
    renderWithProviders(view);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Account settings',
    );
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Two-step verification')).toBeInTheDocument();
    expect(await screen.findByText('Firefox on Linux')).toBeInTheDocument();
  });

  it('has no accessibility violations once loaded', async () => {
    await renderAndAudit(view, () => screen.findByText('Firefox on Linux'));
  });
});
