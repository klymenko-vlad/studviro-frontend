import { cookies } from 'next/headers';

import { InstitutionFrame } from '@/widgets/institution-nav';
import { InstitutionTimeZone } from '@/entities/institution-configuration';
import { SIDEBAR_COOKIE } from '@/shared/config';

export default async function InstitutionLayout({
  children,
  params,
}: LayoutProps<'/institutions/[institutionId]'>) {
  const { institutionId } = await params;
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === 'collapsed';

  return (
    <InstitutionTimeZone institutionId={institutionId}>
      <InstitutionFrame institutionId={institutionId} defaultCollapsed={collapsed}>
        {children}
      </InstitutionFrame>
    </InstitutionTimeZone>
  );
}
