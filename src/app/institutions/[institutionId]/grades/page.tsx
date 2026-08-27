import { MyGradesView } from '@/views/my-grades';

export default async function MyGradesPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <MyGradesView institutionId={institutionId} />;
}
