import type { Metadata } from 'next';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { authModeFrom } from '@/lib/auth';
import { SITE_CONTAINER } from '@/styles/classes';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default async function SignInPage({
  searchParams,
}: PageProps<'/sign-in'>) {
  const mode = authModeFrom((await searchParams).mode);

  return (
    <div className={`${SITE_CONTAINER} py-12`}>
      <div className="flex max-w-md flex-col gap-8">
        <AuthPanel mode={mode} />
      </div>
    </div>
  );
}
