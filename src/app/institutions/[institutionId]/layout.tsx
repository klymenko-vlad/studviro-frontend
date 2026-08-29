import { InstitutionNav } from '@/widgets/institution-nav';

export default async function InstitutionLayout({
  children,
  params,
}: LayoutProps<'/institutions/[institutionId]'>) {
  const { institutionId } = await params;

  return (
    <>
      <InstitutionNav institutionId={institutionId} />
      {children}
    </>
  );
}
