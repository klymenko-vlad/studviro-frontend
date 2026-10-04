import { InstitutionFrame } from '@/widgets/institution-nav';

export default async function InstitutionLayout({
  children,
  params,
}: LayoutProps<'/institutions/[institutionId]'>) {
  const { institutionId } = await params;

  return <InstitutionFrame institutionId={institutionId}>{children}</InstitutionFrame>;
}
