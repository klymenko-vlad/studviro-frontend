import { redirect } from 'next/navigation';

import { AccountSettingsView } from '@/views/account-settings';
import { getCurrentUser } from '@/shared/auth';
import { ROUTES } from '@/shared/config';

export default async function AccountSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.signIn);

  return <AccountSettingsView displayName={user.displayName} email={user.email} />;
}
