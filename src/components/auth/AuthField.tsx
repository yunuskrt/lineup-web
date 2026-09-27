import type { Ref } from 'react';
import { TEXT_INPUT } from '@/styles/classes';
import type { AuthField as AuthFieldName } from '@/types/auth';

export type AuthFieldConfig = {
  name: AuthFieldName;
  label: string;
  type: 'email' | 'password' | 'text';
  autoComplete: string;
  hint?: string;
};

type AuthFieldProps = {
  field: AuthFieldConfig;
  formId: string;
  value: string;
  error?: string;
  isReadOnly: boolean;
  inputRef: Ref<HTMLInputElement>;
  onChange: (value: string) => void;
};

export function AuthField({
  field,
  formId,
  value,
  error,
  isReadOnly,
  inputRef,
  onChange,
}: AuthFieldProps) {
  const inputId = `${formId}-${field.name}`;
  const hintId = field.hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-14 font-medium">
        {field.label}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        name={field.name}
        type={field.type}
        autoComplete={field.autoComplete}
        value={value}
        readOnly={isReadOnly}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
        className={TEXT_INPUT}
      />
      {field.hint ? (
        <p id={hintId} className="text-12 text-fg-muted">
          {field.hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-14 text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
