import { HomeView } from '@/views/home';
import { getCurrentUser } from '@/shared/auth';

/**
 * Route files stay this thin on purpose: they map a URL to a view and nothing
 * else, so page composition stays testable without the Next.js router.
 */
export default async function HomePage() {
  return <HomeView signedIn={(await getCurrentUser()) !== undefined} />;
}
