import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { permissions, renderWithProviders, screen, server } from '@/shared/test';

import { AdminShortcuts } from './admin-shortcuts';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;

function grant(granted: string[]) {
  server.use(
    http.get(PERMISSIONS_URL, () =>
      HttpResponse.json({ ...permissions, permissions: granted }),
    ),
  );
}

describe('AdminShortcuts', () => {
  it('links the screens an administrator runs', async () => {
    renderWithProviders(<AdminShortcuts institutionId={INSTITUTION} />);

    expect(await screen.findByRole('link', { name: /People/ })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/people`,
    );
    expect(screen.getByRole('link', { name: /Roles and invitations/ })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/roles`,
    );
    expect(screen.getByRole('link', { name: /Settings/ })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/settings`,
    );
  });

  it('offers a registrar only the screens a registrar may open', async () => {
    grant(['role:read', 'enrollment:manage', 'grade:publish', 'institution:read']);

    renderWithProviders(<AdminShortcuts institutionId={INSTITUTION} />);

    expect(await screen.findByRole('link', { name: /People/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Org units and rooms/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Catalogue/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Settings/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Audit trail/ })).not.toBeInTheDocument();
  });

  it('renders nothing for somebody who may run none of them', async () => {
    grant(['institution:read']);

    const { container } = renderWithProviders(
      <AdminShortcuts institutionId={INSTITUTION} />,
    );

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(container).toBeEmptyDOMElement();
  });
});
