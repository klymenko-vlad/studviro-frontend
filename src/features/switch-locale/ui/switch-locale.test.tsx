import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test';
import { DropdownMenu, DropdownMenuContent } from '@/shared/ui';

import { LocaleMenuItems } from './switch-locale';

const switchLocale = vi.hoisted(() => vi.fn());

// The Server Action cannot run in jsdom — it needs a request context. What this
// component owes its caller is the right call and the right a11y wiring.
vi.mock('../model/switch-locale', () => ({ switchLocale }));

function renderOpenMenu() {
  return renderWithProviders(
    <DropdownMenu open>
      <DropdownMenuContent>
        <LocaleMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>,
  );
}

describe('LocaleMenuItems', () => {
  it('offers one choice per language, under a label naming the group', async () => {
    renderOpenMenu();

    expect(await screen.findByText('Language')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(2);
  });

  it('marks the active locale so a screen reader can tell them apart', async () => {
    renderOpenMenu();

    // `renderWithProviders` supplies the English catalogue.
    expect(await screen.findByRole('menuitemradio', { name: 'English' })).toBeChecked();
    expect(screen.getByRole('menuitemradio', { name: 'Slovenčina' })).not.toBeChecked();
  });

  it('names each language in that language, not the active one', async () => {
    renderOpenMenu();

    // Someone stuck in a language they cannot read has to be able to find
    // their own — "Slovak" would be useless to them.
    expect(
      await screen.findByRole('menuitemradio', { name: 'Slovenčina' }),
    ).toBeInTheDocument();
  });

  it('switches to the chosen locale', async () => {
    const { user } = renderOpenMenu();

    await user.click(await screen.findByRole('menuitemradio', { name: 'Slovenčina' }));

    expect(switchLocale).toHaveBeenCalledWith('sk');
  });
});
