import { MyCoursesView } from '@/views/my-courses';

export default async function MyCoursesPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <MyCoursesView institutionId={institutionId} />;
}
