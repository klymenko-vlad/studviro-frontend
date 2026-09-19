import { describe, expect, it } from 'vitest';

import { renderAndAudit, renderWithProviders, screen } from '@/shared/test';

import { ContactView } from './contact-view';

describe('ContactView', () => {
  it('renders a single top-level heading', () => {
    renderWithProviders(<ContactView />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Request a demo');
  });

  it('puts the form on the page rather than a link to one', () => {
    renderWithProviders(<ContactView />);

    expect(screen.getByRole('button', { name: 'Request a demo' })).toBeInTheDocument();
  });

  it('resolves every string instead of rendering a message key', () => {
    const { container } = renderWithProviders(<ContactView />);

    expect(container.textContent).not.toMatch(/contact\.|marketing\./);
  });
});

describe('ContactView accessibility', () => {
  it('has no axe violations — a form screen', async () => {
    await renderAndAudit(<ContactView />);
  });
});
