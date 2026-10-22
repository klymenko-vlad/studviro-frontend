import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  permissions,
  renderAndAudit,
  renderWithProviders,
  screen,
  server,
} from '@/shared/test';

import { InstitutionDashboardView } from './institution-dashboard-view';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;

const STUDENT = [
  'institution:read',
  'program:read',
  'course:read',
  'offering:read',
  'enrollment:read',
  'grade:read',
  'schedule:read',
  'notification:read',
  'exam:register',
  'course:enroll',
];
const TEACHER = [...STUDENT, 'role:read', 'grade:propose', 'grade:publish'];

function signInAs(roles: string[], granted: string[]) {
  server.use(
    http.get(PERMISSIONS_URL, () =>
      HttpResponse.json({ ...permissions, roles, permissions: granted }),
    ),
  );
}

describe('InstitutionDashboardView', () => {
  it('names the institution as the page heading once it loads', async () => {
    renderWithProviders(<InstitutionDashboardView institutionId={INSTITUTION} />);

    expect(
      await screen.findByRole('heading', {
        name: 'Pavol Jozef Šafárik University',
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('says which roles the dashboard is built for', async () => {
    signInAs(['teacher', 'student'], TEACHER);

    renderWithProviders(<InstitutionDashboardView institutionId={INSTITUTION} />);

    expect(await screen.findByText('You are here as')).toBeInTheDocument();
    expect(screen.getByText('Teacher')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
  });

  it('gives a student their studies', async () => {
    signInAs(['student'], STUDENT);

    renderWithProviders(<InstitutionDashboardView institutionId={INSTITUTION} />);

    expect(await screen.findByText('Current courses')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('This week')).toBeInTheDocument();
    expect(screen.queryByText('My teaching')).not.toBeInTheDocument();
    expect(screen.queryByText('Recent changes')).not.toBeInTheDocument();
  });

  it('gives a teacher their teaching rather than a student’s tiles', async () => {
    signInAs(['teacher'], TEACHER);

    renderWithProviders(<InstitutionDashboardView institutionId={INSTITUTION} />);

    expect(await screen.findByText('My teaching')).toBeInTheDocument();
    expect(screen.getByText('This week')).toBeInTheDocument();
    expect(
      screen.getByText('The courses you teach this term and the week ahead.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Current courses')).not.toBeInTheDocument();
    expect(screen.queryByText('Results')).not.toBeInTheDocument();
  });

  it('gives an administrator the institution rather than a student’s tiles', async () => {
    signInAs(['institution_admin'], [...permissions.permissions, 'audit:read']);

    renderWithProviders(<InstitutionDashboardView institutionId={INSTITUTION} />);

    expect(await screen.findByText('Academic term')).toBeInTheDocument();
    expect(screen.getByText('Recent changes')).toBeInTheDocument();
    expect(screen.queryByText('Current courses')).not.toBeInTheDocument();
    expect(screen.queryByText('Results')).not.toBeInTheDocument();
    expect(screen.queryByText('My teaching')).not.toBeInTheDocument();
  });

  it('titles each section, and shows the week once, for somebody who teaches and studies', async () => {
    signInAs(['student', 'teacher'], TEACHER);

    renderWithProviders(<InstitutionDashboardView institutionId={INSTITUTION} />);

    const headings = await screen.findAllByRole('heading', { level: 2 });
    expect(headings.map(heading => heading.textContent)).toEqual(['Teaching', 'Studies']);
    expect(screen.getAllByText('This week')).toHaveLength(1);
    expect(
      screen.getByRole('heading', { name: 'Current courses', level: 3 }),
    ).toBeInTheDocument();
  });

  it('leaves a single section untitled, since the header already says what it is', async () => {
    signInAs(['student'], STUDENT);

    renderWithProviders(<InstitutionDashboardView institutionId={INSTITUTION} />);

    expect(
      await screen.findByRole('heading', { name: 'Current courses', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Studies' })).not.toBeInTheDocument();
  });

  it('drops the grades tile when the server withholds grade:read', async () => {
    signInAs(['student'], ['enrollment:read', 'schedule:read']);

    renderWithProviders(<InstitutionDashboardView institutionId={INSTITUTION} />);

    expect(await screen.findByText('Current courses')).toBeInTheDocument();
    expect(screen.queryByText('Results')).not.toBeInTheDocument();
  });

  it('explains a student the server grants neither read', async () => {
    signInAs(['student'], []);

    renderWithProviders(<InstitutionDashboardView institutionId={INSTITUTION} />);

    expect(await screen.findByText('Nothing to show yet')).toBeInTheDocument();
  });

  it('explains a member who holds no role with a dashboard', async () => {
    signInAs([], ['institution:read']);

    renderWithProviders(<InstitutionDashboardView institutionId={INSTITUTION} />);

    expect(await screen.findByText('No dashboard for you here yet')).toBeInTheDocument();
  });
});

describe('InstitutionDashboardView accessibility', () => {
  it('has no axe violations for an administrator', async () => {
    await renderAndAudit(<InstitutionDashboardView institutionId={INSTITUTION} />, () =>
      screen.findByText('Winter semester 2026/2027'),
    );
  });

  it('has no axe violations for somebody who teaches and studies', async () => {
    signInAs(['student', 'teacher'], TEACHER);

    await renderAndAudit(<InstitutionDashboardView institutionId={INSTITUTION} />, () =>
      screen.findByText('Current courses'),
    );
  });
});
