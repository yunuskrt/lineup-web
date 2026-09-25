const LINE = 'fill-none stroke-marking';
const SPOT = 'fill-marking';

type PitchEndProps = {
  goalLineY: number;
  direction: 1 | -1;
};

function PitchEnd({ goalLineY, direction }: PitchEndProps) {
  const penaltyEdge = goalLineY + direction * 18;
  const goalAreaEdge = goalLineY + direction * 6;

  return (
    <>
      <rect
        x={22}
        y={Math.min(goalLineY, penaltyEdge)}
        width={56}
        height={18}
        className={LINE}
        vectorEffect="non-scaling-stroke"
      />
      <rect
        x={37}
        y={Math.min(goalLineY, goalAreaEdge)}
        width={26}
        height={6}
        className={LINE}
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={50}
        cy={goalLineY + direction * 12}
        r={0.6}
        className={SPOT}
      />
    </>
  );
}

type PitchProps = {
  className?: string;
};

export function Pitch({ className = '' }: PitchProps) {
  return (
    <svg
      viewBox="0 0 100 120"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect
        x={2}
        y={2}
        width={96}
        height={116}
        className={LINE}
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={2}
        y1={60}
        x2={98}
        y2={60}
        className={LINE}
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={50}
        cy={60}
        r={12}
        className={LINE}
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={50} cy={60} r={0.6} className={SPOT} />
      <PitchEnd goalLineY={2} direction={1} />
      <PitchEnd goalLineY={118} direction={-1} />
    </svg>
  );
}
