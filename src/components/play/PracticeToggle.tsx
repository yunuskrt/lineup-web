import { useId } from 'react';
import { ProLock } from '@/components/pro/ProLock';
import { FOCUS_RING } from '@/styles/classes';
import type { ProAccess } from '@/types/pro';

type PracticeToggleProps = {
  access: ProAccess;
  isOn: boolean;
  onChange: (isOn: boolean) => void;
};

// Pro while the switch is on (R14); shown locked
export function PracticeToggle({
  access,
  isOn,
  onChange,
}: PracticeToggleProps) {
  const id = useId();

  if (access !== 'open') {
    return (
      <ProLock
        label="Practice"
        caption="Practice is part of Pro: no clock, no lives, not saved."
        isPending={access === 'pending'}
      />
    );
  }

  return (
    <div className="flex items-center gap-3">
      <input
        id={id}
        type="checkbox"
        checked={isOn}
        onChange={(event) => onChange(event.target.checked)}
        className={`size-4 accent-brand ${FOCUS_RING}`}
      />
      <label htmlFor={id} className="text-14 font-medium">
        Practice: no clock, no lives, not saved
      </label>
    </div>
  );
}
