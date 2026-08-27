import { CourseOfferingView } from '@/views/course-offering';

export default async function CourseOfferingPage({
  params,
}: {
  params: Promise<{ institutionId: string; offeringId: string }>;
}) {
  const { institutionId, offeringId } = await params;

  return <CourseOfferingView institutionId={institutionId} offeringId={offeringId} />;
}
