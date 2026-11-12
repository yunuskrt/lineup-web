'use client';

import { type ReactNode, useId, useState } from 'react';
import { PlayStart } from '@/components/play/PlayStart';
import { PracticeToggle } from '@/components/play/PracticeToggle';
import { SoloAllowanceNote } from '@/components/play/SoloAllowanceNote';
import { ProLock, type ProLockSize } from '@/components/pro/ProLock';
import { type ProPlan, ProView } from '@/components/pro/ProView';
import { sampleAllowance } from '@/lib/dev/samples';
import { allowanceLine, isSoloCapped } from '@/lib/solo-allowance';
import { SECONDARY_BUTTON, DEV_PREVIEW_BUTTON } from '@/styles/classes';

const SIZES: ProLockSize[] = ['default', 'large'];
const PLANS: ProPlan[] = ['free', 'pro', 'pending'];

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col items-start gap-2">
      {children}
      <figcaption className="text-12 text-fg-muted">{label}</figcaption>
    </figure>
  );
}

const ALLOWANCE_SAMPLES = [
  { used: 2, label: 'Free, 3 left' },
  { used: 5, label: 'Free, 0 left: Start disabled' },
];

// The real /play pieces on a fixed count
function SoloStartSample({ used }: { used: number }) {
  const id = useId();
  const [now] = useState(() => Date.now());
  const allowance = sampleAllowance(used, now);
  const line = allowanceLine(allowance) ?? '';
  const isCapped = isSoloCapped(allowance);

  return (
    <PlayStart mode="solo" href="#" isCapped={isCapped} describedBy={id}>
      <SoloAllowanceNote
        id={id}
        line={line}
        isCapped={isCapped}
        onPlayDuel={() => {}}
      />
    </PlayStart>
  );
}

function PracticeSample() {
  const [isOn, setIsOn] = useState(true);
  return <PracticeToggle access="open" isOn={isOn} onChange={setIsOn} />;
}

export function ProPreview() {
  const [plan, setPlan] = useState<ProPlan>('free');

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-6">
        <h2 className="text-20 font-semibold">ProLock</h2>
        <div className="flex flex-wrap items-start gap-8">
          {SIZES.map((size) => (
            <Specimen key={`locked-${size}`} label={`Locked, ${size}`}>
              <ProLock
                label="Create room"
                caption="Pro hosts rooms. Anyone can join."
                size={size}
              />
            </Specimen>
          ))}
          {SIZES.map((size) => (
            <Specimen key={`pending-${size}`} label={`Pending, ${size}`}>
              <ProLock
                label="Create room"
                caption="Pro hosts rooms. Anyone can join."
                size={size}
                isPending
              />
            </Specimen>
          ))}
          <Specimen label="Open: the real control">
            <button type="button" className={SECONDARY_BUTTON}>
              Create room
            </button>
          </Specimen>
          <div className="w-72">
            <Specimen label="Locked, full width (the reveal)">
              <ProLock
                label="Reveal the full XI"
                caption="Pro shows every player you missed."
                isFullWidth
              />
            </Specimen>
          </div>
        </div>
      </section>
      <section className="flex flex-col gap-6">
        <h2 className="text-20 font-semibold">Practice (/play)</h2>
        <div className="flex flex-wrap items-start gap-12">
          <Specimen label="Open">
            <PracticeSample />
          </Specimen>
          <Specimen label="Locked: Free, switch on">
            <PracticeToggle access="locked" isOn={false} onChange={() => {}} />
          </Specimen>
          <Specimen label="Pending">
            <PracticeToggle access="pending" isOn={false} onChange={() => {}} />
          </Specimen>
        </div>
      </section>
      <section className="flex flex-col gap-6">
        <h2 className="text-20 font-semibold">Solo runs left (/play)</h2>
        <div className="flex flex-wrap items-start gap-12">
          {ALLOWANCE_SAMPLES.map(({ used, label }) => (
            <Specimen key={used} label={label}>
              <SoloStartSample used={used} />
            </Specimen>
          ))}
        </div>
      </section>
      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="mr-3 text-20 font-semibold">/pro</h2>
          {PLANS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={plan === option}
              onClick={() => setPlan(option)}
              className={DEV_PREVIEW_BUTTON}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="text-14 text-fg-muted">
          With the switch off (NEXT_PUBLIC_MOCK_PRO_ENABLED=false), /pro itself
          is not found.
        </p>
        <ProView plan={plan} />
      </section>
    </div>
  );
}
