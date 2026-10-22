import { InstitutionFrame } from '@/widgets/institution-nav';
import { InstitutionTimeZone } from '@/entities/institution-configuration';

export default async function InstitutionLayout({
  children,
  params,
}: LayoutProps<'/institutions/[institutionId]'>) {
  const { institutionId } = await params;

  return (
    <InstitutionTimeZone institutionId={institutionId}>
      <InstitutionFrame institutionId={institutionId}>{children}</InstitutionFrame>
    </InstitutionTimeZone>
  );
}
