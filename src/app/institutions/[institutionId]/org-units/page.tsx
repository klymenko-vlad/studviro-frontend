import { institutionRoutes, redirect } from '@/shared/config';

/** This screen is a tab of an administration hub now; old links land there. */
export default async function MovedPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  redirect(institutionRoutes(institutionId).orgUnits);
}
