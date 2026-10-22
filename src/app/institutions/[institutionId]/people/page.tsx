import { InstitutionPeopleView } from '@/views/institution-people';

export default async function InstitutionPeoplePage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <InstitutionPeopleView institutionId={institutionId} />;
}
