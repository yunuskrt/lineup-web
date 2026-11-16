'use client';

import { OTPInput, OTPInputContext } from 'input-otp';
import { type ComponentProps, useContext } from 'react';
import { cn } from '@/lib/utils';
import { CODE_BOX } from '@/styles/classes';

// neobrutalism.dev Input OTP: one real input, boxes drawn over it
export function InputOTP({
  className,
  containerClassName,
  ...props
}: ComponentProps<typeof OTPInput>) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        'flex items-center has-disabled:opacity-70',
        containerClassName,
      )}
      className={cn('disabled:cursor-not-allowed', className)}
      {...props}
    />
  );
}

export function InputOTPGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn('flex items-center', className)}
      {...props}
    />
  );
}

export function InputOTPSlot({
  index,
  className,
  ...props
}: ComponentProps<'div'> & { index: number }) {
  const context = useContext(OTPInputContext);
  const { char, placeholderChar, hasFakeCaret, isActive } =
    context.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        `size-10 data-[active=true]:z-10 data-[active=true]:outline-2 data-[active=true]:outline-offset-2 data-[active=true]:outline-focus ${CODE_BOX}`,
        className,
      )}
      {...props}
    >
      {char ?? <span className="text-fg-dim">{placeholderChar}</span>}
      {/* Static: no new motion in C2 */}
      {hasFakeCaret ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span className="h-5 w-0.5 bg-fg" />
        </span>
      ) : null}
    </div>
  );
}
