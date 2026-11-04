import { redirect } from 'next/navigation';

import { AccountView } from '@/views/account';
import { getCurrentUser } from '@/shared/auth';
import { ROUTES } from '@/shared/config';

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.signIn);

  return <AccountView displayName={user.displayName} email={user.email} />;
}
