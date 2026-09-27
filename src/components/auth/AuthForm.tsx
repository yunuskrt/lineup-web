'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import type { z } from 'zod';
import { AuthField, type AuthFieldConfig } from '@/components/auth/AuthField';
import { authErrorMessageOf, authFieldErrors } from '@/lib/auth';
import { PRIMARY_BUTTON_LARGE } from '@/styles/classes';
import type {
  AuthField as AuthFieldName,
  AuthFieldErrors,
  AuthFieldValues,
} from '@/types/auth';

type AuthFormProps<S extends z.ZodType> = {
  schema: S;
  fields: AuthFieldConfig[];
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
  error: unknown;
  onSubmit: (request: z.output<S>) => void;
};

export function AuthForm<S extends z.ZodType>({
  schema,
  fields,
  submitLabel,
  pendingLabel,
  isPending,
  error,
  onSubmit,
}: AuthFormProps<S>) {
  const formId = useId();
  const [values, setValues] = useState<AuthFieldValues>({});
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const inputs = useRef<Partial<Record<AuthFieldName, HTMLInputElement>>>({});

  function handleChange(name: AuthFieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = authFieldErrors(schema, values);
      setErrors(fieldErrors);
      const firstInvalid = fields.find((field) => fieldErrors[field.name]);
      if (firstInvalid) inputs.current[firstInvalid.name]?.focus();
      return;
    }

    onSubmit(parsed.data);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {fields.map((field) => (
        <AuthField
          key={field.name}
          field={field}
          formId={formId}
          value={values[field.name] ?? ''}
          error={errors[field.name]}
          isReadOnly={isPending}
          inputRef={(node) => {
            if (node) inputs.current[field.name] = node;
          }}
          onChange={(value) => handleChange(field.name, value)}
        />
      ))}
      {error && !isPending ? (
        <p role="alert" className="text-14 text-danger">
          {authErrorMessageOf(error)}
        </p>
      ) : null}
      <div>
        <button
          type="submit"
          disabled={isPending}
          className={PRIMARY_BUTTON_LARGE}
        >
          {isPending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
