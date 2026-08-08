import { beforeEach, describe, expect, it } from 'vitest';

import { applyTheme, useThemeStore } from './theme-store';

describe('theme store', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    useThemeStore.setState({ theme: 'system' });
  });

  it('defaults to following the operating system', () => {
    expect(useThemeStore.getState().theme).toBe('system');
  });

  it('adds the dark class the design tokens key off', () => {
    applyTheme('dark');

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('removes the dark class for the light theme', () => {
    applyTheme('dark');
    applyTheme('light');

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('applies the class when the theme is set through the store', () => {
    useThemeStore.getState().setTheme('dark');

    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('resolves `system` against the media query (false in jsdom)', () => {
    applyTheme('system');

    // The jsdom matchMedia stub reports `matches: false`, i.e. light.
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
