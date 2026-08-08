import { HomeView } from '@/views/home';

/**
 * Route files stay this thin on purpose: they map a URL to a view and nothing
 * else, so page composition stays testable without the Next.js router.
 */
export default function HomePage() {
  return <HomeView />;
}
