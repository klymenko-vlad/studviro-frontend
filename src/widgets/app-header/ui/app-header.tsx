import { getCurrentUser } from '@/shared/auth';

import { AppHeaderBar } from './app-header-bar';

/**
 * The one navigation surface every page shares. The session is resolved on the
 * server, so the header renders in its signed-in or signed-out shape directly
 * rather than flickering through the wrong one on the client first.
 */
export async function AppHeader() {
  const user = await getCurrentUser();

  return (
    <AppHeaderBar
      signedIn={user !== undefined}
      isPlatformOperator={user?.role === 'admin'}
    />
  );
}
