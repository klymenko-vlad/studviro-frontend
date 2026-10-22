import { MyNotificationsView } from '@/views/my-notifications';

export default async function MyNotificationsPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <MyNotificationsView institutionId={institutionId} />;
}
