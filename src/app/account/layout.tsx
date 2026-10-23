import type { ReactNode } from 'react';
import { cookies } from 'next/headers';

import { InstitutionFrame } from '@/widgets/institution-nav';
import { InstitutionTimeZone } from '@/entities/institution-configuration';
import { getMyInstitutions } from '@/shared/auth';
import { LAST_INSTITUTION_COOKIE, SIDEBAR_COOKIE } from '@/shared/config';

/**
 * The account belongs to the person, not to an institution, but a person
 * reaches it from inside one — so it keeps the sidebar of the institution they
 * last worked in, or of their only one. Somebody in none gets the page alone.
 */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const store = await cookies();
  const institutions = await getMyInstitutions();
  const last = store.get(LAST_INSTITUTION_COOKIE)?.value;
  const institutionId =
    institutions.find(institution => institution.id === last)?.id ?? institutions[0]?.id;

  if (institutionId === undefined) return children;

  return (
    <InstitutionTimeZone institutionId={institutionId}>
      <InstitutionFrame
        institutionId={institutionId}
        defaultCollapsed={store.get(SIDEBAR_COOKIE)?.value === 'collapsed'}
      >
        {children}
      </InstitutionFrame>
    </InstitutionTimeZone>
  );
}
