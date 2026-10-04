import { InstitutionDashboardView } from '@/views/institution-dashboard';

export default async function InstitutionDashboardPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <InstitutionDashboardView institutionId={institutionId} />;
}
