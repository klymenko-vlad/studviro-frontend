import { InstitutionAuditView } from '@/views/institution-audit';

export default async function InstitutionAuditPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <InstitutionAuditView institutionId={institutionId} />;
}
