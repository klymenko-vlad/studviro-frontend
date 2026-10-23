import { TeacherProfileView } from '@/views/teacher-profile';

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ institutionId: string; userId: string }>;
}) {
  const { institutionId, userId } = await params;

  return <TeacherProfileView institutionId={institutionId} teacherId={userId} />;
}
