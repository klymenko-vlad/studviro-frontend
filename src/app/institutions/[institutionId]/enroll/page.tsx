import { EnrollCoursesView } from '@/views/enroll-courses';

export default async function EnrollCoursesPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <EnrollCoursesView institutionId={institutionId} />;
}
