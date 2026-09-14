import { InstitutionLearningView } from '@/views/institution-learning';

export default async function InstitutionLearningPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <InstitutionLearningView institutionId={institutionId} />;
}
