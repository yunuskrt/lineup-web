import { Check } from 'lucide-react';
import {
  isStepFilled,
  isStepReachable,
  PLAY_STEP_NAMES,
  PLAY_STEPS,
  type PlayStep,
  type StepProgress,
} from '@/lib/play-steps';
import { cn } from '@/lib/utils';
import { FOCUS_RING } from '@/styles/classes';

type PlayStepsProps = {
  current: PlayStep;
  progress: StepProgress;
  // What each filled step holds, shown from sm
  choices: Partial<Record<PlayStep, string>>;
  onGo: (step: PlayStep) => void;
};

const DISC =
  'flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-line font-display text-14 font-extrabold tabular-nums sm:size-8';

export function PlaySteps({
  current,
  progress,
  choices,
  onGo,
}: PlayStepsProps) {
  return (
    <nav aria-label="Play steps">
      <ol className="flex items-center gap-1.5 sm:gap-3">
        {PLAY_STEPS.map((step, index) => {
          const isCurrent = step === current;
          const isDone = !isCurrent && isStepFilled(step, progress);
          const isReachable = isStepReachable(step, progress);
          const choice = isStepFilled(step, progress) ? choices[step] : null;
          return (
            <li
              key={step}
              className="flex min-w-0 items-center gap-1.5 not-last:flex-1 sm:gap-3"
            >
              <button
                type="button"
                disabled={!isReachable}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => onGo(step)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-md text-left disabled:cursor-not-allowed disabled:text-fg-muted sm:gap-2.5',
                  FOCUS_RING,
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    DISC,
                    isCurrent ? 'bg-brand text-on-accent' : 'bg-surface-card',
                  )}
                >
                  {isDone ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="flex flex-col">
                  <span className="text-14 leading-5 font-semibold sm:text-16 sm:leading-6">
                    {PLAY_STEP_NAMES[step]}
                  </span>
                  {choice ? (
                    <span className="hidden text-12 leading-4 text-fg-muted sm:block">
                      {choice}
                    </span>
                  ) : null}
                </span>
              </button>
              {index < PLAY_STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="h-0.5 min-w-3 flex-1 bg-line"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
