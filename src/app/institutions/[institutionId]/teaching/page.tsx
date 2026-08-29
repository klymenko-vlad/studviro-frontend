import { MyTeachingView } from '@/views/my-teaching';

export default async function MyTeachingPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <MyTeachingView institutionId={institutionId} />;
}
