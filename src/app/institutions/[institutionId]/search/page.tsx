import { InstitutionSearchView } from '@/views/institution-search';

export default async function InstitutionSearchPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <InstitutionSearchView institutionId={institutionId} />;
}
