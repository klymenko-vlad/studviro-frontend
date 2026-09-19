import { InstitutionProgramView } from '@/views/institution-program';

export default async function InstitutionProgramPage({
  params,
}: {
  params: Promise<{ institutionId: string; programId: string }>;
}) {
  const { institutionId, programId } = await params;

  return <InstitutionProgramView institutionId={institutionId} programId={programId} />;
}
