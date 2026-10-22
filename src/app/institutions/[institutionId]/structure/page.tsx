import { InstitutionStructureView } from '@/views/institution-structure';

export default async function InstitutionStructurePage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <InstitutionStructureView institutionId={institutionId} />;
}
