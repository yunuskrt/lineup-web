import React from 'react';
import { SPOT, STROKE } from '@/components/pitch/pitch/styles';

type Props = {
  goalLineY: number;
  direction: 1 | -1;
};

const PitchEnd = ({ goalLineY, direction }: Props) => {
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
};

export default PitchEnd;
