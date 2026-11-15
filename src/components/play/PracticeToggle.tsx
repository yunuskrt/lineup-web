import { ProLock } from '@/components/pro/ProLock';
import { Checkbox } from '@/components/ui/checkbox';
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
    <label className="flex w-fit cursor-pointer items-center gap-3 text-14 font-medium">
      <Checkbox checked={isOn} onCheckedChange={onChange} />
      Practice: no clock, no lives, not saved
    </label>
  );
}
