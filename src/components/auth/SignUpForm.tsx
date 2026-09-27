'use client';

import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import type { AuthFieldConfig } from '@/components/auth/AuthField';
import { useSignUp } from '@/hooks/use-auth';
import { signUpRequestSchema } from '@/lib/api/schemas/auth';
import type { SignUpRequest } from '@/types/auth';

export const SIGN_UP_FIELDS: AuthFieldConfig[] = [
  {
    name: 'handle',
    label: 'Handle',
    type: 'text',
    autoComplete: 'username',
    hint: 'Your name in duels.',
  },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    autoComplete: 'new-password',
  },
];

export function SignUpForm() {
  const router = useRouter();
  const signUp = useSignUp();

  async function handleSubmit(request: SignUpRequest) {
    try {
      await signUp.mutateAsync(request);
      router.push('/play');
    } catch {
      // Shown through signUp.error
    }
  }

  return (
    <AuthForm
      schema={signUpRequestSchema}
      fields={SIGN_UP_FIELDS}
      submitLabel="Create account"
      pendingLabel="Creating account…"
      isPending={signUp.isPending}
      error={signUp.error}
      onSubmit={handleSubmit}
    />
  );
}
