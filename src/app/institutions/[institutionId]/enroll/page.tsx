import { institutionRoutes, redirect } from '@/shared/config';

/** Finding a course is a tab of the courses page now; old links land there. */
export default async function EnrollCoursesPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  redirect(institutionRoutes(institutionId).enroll);
}
