import { MyExamsView } from '@/views/my-exams';

export default async function MyExamsPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <MyExamsView institutionId={institutionId} />;
}
