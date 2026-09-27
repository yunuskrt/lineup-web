'use client';

import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import type { AuthFieldConfig } from '@/components/auth/AuthField';
import { useSignIn } from '@/hooks/use-auth';
import { signInRequestSchema } from '@/lib/api/schemas/auth';
import type { SignInRequest } from '@/types/auth';

export const SIGN_IN_FIELDS: AuthFieldConfig[] = [
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    autoComplete: 'current-password',
  },
];

export function SignInForm() {
  const router = useRouter();
  const signIn = useSignIn();

  async function handleSubmit(request: SignInRequest) {
    try {
      await signIn.mutateAsync(request);
      router.push('/play');
    } catch {
      // Shown through signIn.error
    }
  }

  return (
    <AuthForm
      schema={signInRequestSchema}
      fields={SIGN_IN_FIELDS}
      submitLabel="Sign in"
      pendingLabel="Signing in…"
      isPending={signIn.isPending}
      error={signIn.error}
      onSubmit={handleSubmit}
    />
  );
}
