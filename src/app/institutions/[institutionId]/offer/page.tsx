import { InstitutionOfferView } from '@/views/institution-offer';

export default async function InstitutionOfferPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <InstitutionOfferView institutionId={institutionId} />;
}
