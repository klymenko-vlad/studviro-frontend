import { InstitutionOrgUnitsView } from '@/views/institution-org-units';

export default async function InstitutionOrgUnitsPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <InstitutionOrgUnitsView institutionId={institutionId} />;
}
