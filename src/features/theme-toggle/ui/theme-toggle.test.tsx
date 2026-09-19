import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test';
import { DropdownMenu, DropdownMenuContent } from '@/shared/ui';

import { ThemeMenuItems } from './theme-toggle';

function renderOpenMenu() {
  return renderWithProviders(
    <DropdownMenu open>
      <DropdownMenuContent>
        <ThemeMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>,
  );
}

describe('ThemeMenuItems', () => {
  it('offers one choice per theme, under a label naming the group', async () => {
    renderOpenMenu();

    expect(await screen.findByText('Theme')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(3);
  });

  it('marks the active theme so a screen reader can tell them apart', async () => {
    renderOpenMenu();

    expect(await screen.findByRole('menuitemradio', { name: 'System' })).toBeChecked();
    expect(screen.getByRole('menuitemradio', { name: 'Dark' })).not.toBeChecked();
  });

  it('switches to the chosen theme', async () => {
    const { user } = renderOpenMenu();

    await user.click(await screen.findByRole('menuitemradio', { name: 'Dark' }));

    expect(document.documentElement).toHaveClass('dark');
  });
});
