import { InstitutionCatalogueView } from '@/views/institution-catalogue';

export default async function InstitutionCataloguePage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <InstitutionCatalogueView institutionId={institutionId} />;
}
