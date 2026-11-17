import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

type AuthErrorProps = {
  id?: string;
  role?: 'alert';
  children: ReactNode;
};

// The icon says it too, not the colour alone
export function AuthError({ id, role, children }: AuthErrorProps) {
  return (
    <p
      id={id}
      role={role}
      className="flex items-start gap-1.5 text-14 leading-5 text-danger-text"
    >
      <CircleAlert
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-danger-text"
      />
      <span>{children}</span>
    </p>
  );
}
