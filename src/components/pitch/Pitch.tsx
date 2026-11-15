// Ink at 2px whatever the pitch's rendered size
const STROKE = {
  className: 'fill-none stroke-line',
  strokeWidth: 2,
  vectorEffect: 'non-scaling-stroke',
} as const;

const SPOT = 'fill-line';

// Mown checks inside the lines, as game/02-pitch-b
const CHECK_COLUMNS = 8;
const CHECK_ROWS = 10;
const CHECK_WIDTH = 96 / CHECK_COLUMNS;
const CHECK_HEIGHT = 116 / CHECK_ROWS;

const CHECKS = Array.from(
  { length: CHECK_COLUMNS * CHECK_ROWS },
  (_, index) => ({
    column: index % CHECK_COLUMNS,
    row: Math.floor(index / CHECK_COLUMNS),
  }),
).filter(({ column, row }) => (column + row) % 2 === 0);

const CORNER_RADIUS = 1.5;
const NEAR = 2 + CORNER_RADIUS;
const FAR_X = 98 - CORNER_RADIUS;
const FAR_Y = 118 - CORNER_RADIUS;

const CORNER_ARCS = [
  `M 2 ${NEAR} A ${CORNER_RADIUS} ${CORNER_RADIUS} 0 0 0 ${NEAR} 2`,
  `M ${FAR_X} 2 A ${CORNER_RADIUS} ${CORNER_RADIUS} 0 0 0 98 ${NEAR}`,
  `M 98 ${FAR_Y} A ${CORNER_RADIUS} ${CORNER_RADIUS} 0 0 0 ${FAR_X} 118`,
  `M ${NEAR} 118 A ${CORNER_RADIUS} ${CORNER_RADIUS} 0 0 0 2 ${FAR_Y}`,
];

type PitchEndProps = {
  goalLineY: number;
  direction: 1 | -1;
};

function PitchEnd({ goalLineY, direction }: PitchEndProps) {
  const penaltyEdge = goalLineY + direction * 18;
  const goalAreaEdge = goalLineY + direction * 6;
  const spotY = goalLineY + direction * 12;
  // The arc bulges away from the goal
  const sweep = direction === 1 ? 0 : 1;

  return (
    <>
      <rect
        x={22}
        y={Math.min(goalLineY, penaltyEdge)}
        width={56}
        height={18}
        {...STROKE}
      />
      <rect
        x={37}
        y={Math.min(goalLineY, goalAreaEdge)}
        width={26}
        height={6}
        {...STROKE}
      />
      <path
        d={`M 42 ${penaltyEdge} A 10 10 0 0 ${sweep} 58 ${penaltyEdge}`}
        {...STROKE}
      />
      <circle cx={50} cy={spotY} r={0.8} className={SPOT} />
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
      <rect width={100} height={120} className="fill-turf" />
      {CHECKS.map(({ column, row }) => (
        <rect
          key={`${column}-${row}`}
          x={2 + column * CHECK_WIDTH}
          y={2 + row * CHECK_HEIGHT}
          width={CHECK_WIDTH}
          height={CHECK_HEIGHT}
          className="fill-turf-check"
        />
      ))}
      <rect x={2} y={2} width={96} height={116} {...STROKE} />
      <line x1={2} y1={60} x2={98} y2={60} {...STROKE} />
      <circle cx={50} cy={60} r={12} {...STROKE} />
      <circle cx={50} cy={60} r={0.8} className={SPOT} />
      {CORNER_ARCS.map((d) => (
        <path key={d} d={d} {...STROKE} />
      ))}
      <PitchEnd goalLineY={2} direction={1} />
      <PitchEnd goalLineY={118} direction={-1} />
    </svg>
  );
}
