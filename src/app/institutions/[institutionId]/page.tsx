import { StudentDashboardView } from '@/views/student-dashboard';

export default async function InstitutionDashboardPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <StudentDashboardView institutionId={institutionId} />;
}
