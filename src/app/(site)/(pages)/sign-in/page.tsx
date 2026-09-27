import type { Metadata } from 'next';
import { SITE_CONTAINER } from '@/styles/classes';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function SignInPage() {
  return (
    <div className={`${SITE_CONTAINER} py-12`}>
      <h1 className="font-display text-32 font-bold">Sign in</h1>
    </div>
  );
}
