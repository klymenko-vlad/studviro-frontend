import { InstitutionRolesView } from '@/views/institution-roles';

export default async function InstitutionRolesPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <InstitutionRolesView institutionId={institutionId} />;
}
