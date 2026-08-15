import { InstitutionSettingsView } from '@/views/institution-settings';

export default async function InstitutionSettingsPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <InstitutionSettingsView institutionId={institutionId} />;
}
