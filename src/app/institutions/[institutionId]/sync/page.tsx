import { InstitutionSyncView } from '@/views/institution-sync';

export default async function InstitutionSyncPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <InstitutionSyncView institutionId={institutionId} />;
}
