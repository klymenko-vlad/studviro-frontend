import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test';

import { SwitchLocale } from './switch-locale';

const switchLocale = vi.hoisted(() => vi.fn());

// The Server Action cannot run in jsdom — it needs a request context. What this
// component owes its caller is the right call and the right a11y wiring.
vi.mock('../model/switch-locale', () => ({ switchLocale }));

describe('SwitchLocale', () => {
  it('exposes one radio per language, in a labelled group', () => {
    renderWithProviders(<SwitchLocale />);

    expect(screen.getByRole('radiogroup', { name: 'Language' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('marks the active locale as checked so a screen reader can tell them apart', () => {
    renderWithProviders(<SwitchLocale />);

    // `renderWithProviders` supplies the English catalogue.
    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Slovenčina' })).not.toBeChecked();
  });

  it('names each language in that language, not the active one', () => {
    renderWithProviders(<SwitchLocale />);

    // Someone stuck in a language they cannot read has to be able to find
    // their own — "Slovak" would be useless to them.
    expect(screen.getByRole('radio', { name: 'Slovenčina' })).toBeInTheDocument();
  });

  it('switches to the chosen locale', async () => {
    const { user } = renderWithProviders(<SwitchLocale />);

    await user.click(screen.getByRole('radio', { name: 'Slovenčina' }));

    expect(switchLocale).toHaveBeenCalledWith('sk');
  });
});
