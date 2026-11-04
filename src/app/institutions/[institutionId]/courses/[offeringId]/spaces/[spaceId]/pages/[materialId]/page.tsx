import { CoursePageView } from '@/views/course-page';

export default async function CoursePagePage({
  params,
}: {
  params: Promise<{
    institutionId: string;
    offeringId: string;
    spaceId: string;
    materialId: string;
  }>;
}) {
  const { institutionId, offeringId, spaceId, materialId } = await params;

  return (
    <CoursePageView
      institutionId={institutionId}
      offeringId={offeringId}
      spaceId={spaceId}
      materialId={materialId}
    />
  );
}
