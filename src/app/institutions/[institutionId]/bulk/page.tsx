import { InstitutionBulkView } from '@/views/institution-bulk';

export default async function InstitutionBulkPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <InstitutionBulkView institutionId={institutionId} />;
}
