import { MyCalendarView } from '@/views/my-calendar';

export default async function MyCalendarPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  return <MyCalendarView institutionId={institutionId} />;
}
